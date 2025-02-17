let coreUtil = require('../../util/CoreUtil.js');
let MathMoney = coreUtil.MathMoney;

let parseThresholds = coreUtil.parseThresholds;
let computeStakeSublinear = coreUtil.computeStakeSublinear;
let computePercent = coreUtil.computePercent;


function HatefinityLogic(persistence){
    let values;
    let settings = {};
    let tickReduction = 1;
    let self = undefined;
    let tickInterval = undefined;

    this.setSelf = function(newSelf){
        self = newSelf;
    }
    let makeChannelSettingsFunction = function(settingsName){
        return function(channelID){
            if(channelID === undefined || !values.channels[channelID]){
                throw new Error("Invalid channelID " + channelID);
            }
            return values.channels[channelID].settings[settingsName];
        }
    }

    let getMaxNumberOfActiveArticlesInChannel = makeChannelSettingsFunction("maxNumberOfActiveArticlesInChannel");
    let getAlphaForQuadraticStakeDistribution = makeChannelSettingsFunction("alphaForQuadraticStakeDistribution");
    let getTickReduction = makeChannelSettingsFunction("tickReduction");
    let getMinBoostAmount = makeChannelSettingsFunction("minBoostAmount");
    let  getStakeHoldersReward = makeChannelSettingsFunction("stakeHoldersReward");
    this.getNumberOfRewardedArticles  = makeChannelSettingsFunction("numberOfRewardedArticles");


    this.configure = async function(newSettings){
        settings = newSettings;
        values = await persistence.load();
        function ensureDefaultSettings(name, defaultValue){
            if (!settings[name]){
                settings[name] = defaultValue;
            }
        }
        ensureDefaultSettings("tickReduction", 1);
        ensureDefaultSettings("minBoostAmount", 0.001);
        ensureDefaultSettings("maxNumberOfActiveArticlesInChannel", 100);
        ensureDefaultSettings("alphaForQuadraticStakeDistribution", 0.5);
        ensureDefaultSettings("numberOfRewardedArticles", 10)
        ensureDefaultSettings("stakeHoldersReward", 0.1)    //10%

        if(!settings.rewardArticles || typeof settings.rewardArticles !== "function"){
            throw new Error("Invalid rewardArticles function");
        }
    }

    function validateInput(channelId, articleId, commentId){
        if(!values.channels[channelId]){
            throw new Error("Invalid channelId " + channelId);
        }
        if(!values.channels[channelId].articles[articleId]){
            throw new Error("Invalid articleId " + articleId);
        }

        if(commentId && !values.channels[channelId].articles[articleId].comments[commentId]){
            throw new Error("Invalid commentId " + commentId);
        }
    }

    function validateObjectIDs(objectIDsAsArray){
        objectIDsAsArray.map(objectID => {
            if(!objectID || typeof objectID !== "string"){
                console.debug("Invalid objectID " + objectID);
                throw new Error("Invalid objectID " + objectID);
            }
        });
    }



    this.createChannel = this.addChannel =  async function(publicName, firstStakeHolder, channelSettings){

        function ensureGoodSettings(name){
            if(!channelSettings[name]){
                channelSettings[name] = settings[name];
            }
        }
        if(!channelSettings){
            channelSettings = {};
        }

        ensureGoodSettings("tickReduction");
        ensureGoodSettings("minBoostAmount");
        ensureGoodSettings("maxNumberOfActiveArticlesInChannel");
        ensureGoodSettings("alphaForQuadraticStakeDistribution");
        ensureGoodSettings("taxSettings");
        ensureGoodSettings("numberOfRewardedArticles");

        let channelID =  await persistence.createChannelAccount(publicName);
        channelID = channelID.id;
        console.debug("Creating channel " + publicName + " with id " + JSON.stringify(channelID));

        values.channels[channelID] = {
            articles: {},
            publicName: publicName,
            sortedArticles: [],
            stakeHolders: {},
            settings: channelSettings
        };

        values.channels[channelID].stakeHolders[firstStakeHolder] = settings.channelCreationPrice;

        persistence.blockFunds(firstStakeHolder, settings.channelCreationPrice, "Create channel " + channelID);
        persistence.store(values);
        console.debug("Adding channel " + publicName + " with id " + channelID + " and first stake holder " + firstStakeHolder);
        return channelID;
    }

    this.getChannelInfo = function(channelId){
        return values.channels[channelId];
    }

    this.listChannels = function(){
        let result = [];
        for(let channelId in values.channels){
            result.push({id:channelId, publicName:values.channels[channelId].publicName});
        }
        return result;
    }

    this.getChannelsWeight = function(){
        let amounts = {};
        for(let channelId in values.channels){
            amounts[channelId] = 0
            for(let stakeHolder in values.channels[channelId].stakeHolders){
                amounts[channelId] += values.channels[channelId].stakeHolders[stakeHolder];
            }
        }
        return computePercent(amounts);
    }

    this.rewardChannelStakeholders = function (amount, channelId){
        //take from config the amount that is distributed to channel stakeholders
        let rewardAmount = MathMoney.roundPoints(amount * getStakeHoldersReward(channelId));
        let stakeholdersPercents = computePercent(values.channels[channelId].stakeHolders);
        for(let stakeHolderId in values.channels[channelId].stakeHolders){
            console.debug("Rewarding stakeholder " + stakeHolderId + " in channel " + channelId + " with amount " + stakeholdersPercents[stakeHolderId] *  rewardAmount, stakeholdersPercents);
            self.rewardUserFromChannelAccount(channelId , stakeHolderId,  stakeholdersPercents[stakeHolderId] *  rewardAmount, "Reward stakeholders in channel " + channelId);
        }
        return amount - rewardAmount;
    }

    this.rewardUserFromChannelAccount = function(channelId, accountID, amount, reasonWhy) {
        if(amount === 0){
            //nothing to transfer
            return;
        }
        return persistence.transfer(amount, channelId, accountID, reasonWhy);
    }

    this.getChannelBalance = function(channelId){
        return persistence.getBalance(channelId);
    }

    this.rewardChannel = function(channelId, amount, reasonWhy) {
        return persistence.rewardChannel(channelId, amount, reasonWhy);
    }


    this.taxContent = function taxContent(forUser, value, channelID){
        let taxSettings = values.channels[channelID].settings.taxSettings;
        let parsedTaxSettings = parseThresholds(taxSettings);

        let dueTax = 0;
        for(let i = 0; i < parsedTaxSettings.length; i++){
            if(value <= parsedTaxSettings[i].threshold){
                dueTax = parsedTaxSettings[i].value;
                break;
            }
        }
        let taxValue = MathMoney.roundPoints(value * dueTax);
        persistence.transfer( taxValue, forUser, channelID, "Tax for content in channel " + channelID);
        return value - taxValue;
    }


    this.publishArticle = function publish(amount,  authorId, channelID, articleId) {
        console.debug("Publishing article " + articleId + " in channel " + channelID + " by " + authorId + " with amount " + amount);
        if(!values.channels[channelID]){
            throw new Error("Invalid channelId " + channelID);
        }
        if(amount < getMinBoostAmount(channelID)){
            throw new Error("Creation amount too small " + amount + " for article " + articleId);
        }
        validateObjectIDs([authorId, channelID, articleId]);
        amount = this.taxContent(authorId, amount, channelID);
        persistence.blockFunds(authorId, amount , "Publish Article " + articleId + " in channel " + channelID);
        values.channels[channelID].articles[articleId] = {
            id: articleId,
            currentWeight: amount,
            creationAmount:amount,
            creationTick: values._currentTick + 1, //will participate in sorting from the next tick
            owner: authorId,
            boosts: [],
            comments: {} ,
            sortedComments: [],
            creationTime: Date.now(),
        };
    }

    this.getNewArticles = function getNewArticleId(channelID, lastNSeconds){
        let  newArticles = [];
        let currentTime = Date.now();
        let lastNSecondsInMs = lastNSeconds * 1000;
        for(let articleId in values.channels[channelID].articles){
            let articleInfo = values.channels[channelID].articles[articleId];
            if(articleInfo.creationTime > currentTime - lastNSecondsInMs){
                newArticles.push(articleId);
            }
        }
        return newArticles;
    }

    this.addComment = function addComment(amount, authorId, channelID, articleId, commentId) {
        if(!commentId || typeof commentId !== "string"){
            throw new Error("Invalid commentId " + commentId);
        }
        if(amount < getMinBoostAmount(channelID)){
            throw new Error("Creation amount too small " + amount + " for comment " + commentId);
        }
        console.debug("Adding comment " + commentId + " to article " + articleId + " in channel " + channelID + " by " + authorId + " with amount " + amount);
        validateObjectIDs([authorId, channelID, articleId, commentId]);
        validateInput(channelID, articleId);
        amount = this.taxContent(authorId, amount, channelID);
        persistence.blockFunds(authorId, amount, channelID, "Add comment " + commentId + " to article " + articleId);
        getArticleInfo(channelID, articleId).comments[commentId]= { id:commentId, currentWeight: amount,  creationAmount:amount, creationTick: values._currentTick + 1, owner:authorId,  boosts: []};
    }

    this.boostPost = function votePost(amount, boosterId, channelId, articleId) {
        validateObjectIDs([boosterId, channelId, articleId]);
        if(amount < getMinBoostAmount(channelId)){
            throw new Error("Boost amount too small " + amount + " for article " + articleId);
        }
        console.debug("Boosting post " + articleId + " in channel " + channelId + " by " + boosterId + " with amount " + amount);
        validateInput(channelId, articleId);
        amount = this.taxContent(boosterId, amount, channelId);
        persistence.blockFunds(boosterId, amount, "Boost post " + articleId + " in channel " + channelId);
        getArticleInfo(channelId, articleId).boosts.push({owner:boosterId, amount, creationTick: values._currentTick + 1});
    }
    this.boostArticle = this.boostPost;

    this.boostComment = function boostComment(amount, boosterId, channelId, articleId, commentId) {
        validateObjectIDs([boosterId, channelId, articleId, commentId]);
        if(amount < getMinBoostAmount(channelId)){
            throw new Error("Boost amount too small " + amount + " for comment " + commentId);
        }
        if(!commentId || typeof commentId !== "string"){
            throw new Error("Invalid commentId " + commentId);
        }
        console.debug("Boosting comment " + commentId + " to article " + articleId + " in channel " + channelId + " by " + boosterId + " with amount " + amount);
        validateInput(channelId, articleId, commentId);
        amount = this.taxContent(boosterId, amount, channelId);
        persistence.blockFunds(boosterId, amount, "Boost comment " + commentId + " to article " + articleId + " in channel " + channelId);
        getArticleInfo(channelId, articleId).comments[commentId].boosts.push({owner:boosterId, amount, creationTick: values._currentTick + 1});
    }

    this.listActiveArticles = function listActiveArticles(channelId){
        return Object.keys(values.channels[channelId].articles);
    }

    function checkArticleData(articleInfo){
        if(!articleInfo){
            throw new Error("Invalid articleId ");
        }
        if(!articleInfo.owner || !articleInfo.creationAmount){
            throw new Error("Invalid articleInfo " + articleInfo);
        }
        for(let boost of articleInfo.boosts){
            if(!boost.owner || !boost.amount){
                throw new Error("Invalid boost owner " + boost.owner + " or amount " + boost.amount + "in article " + articleInfo.id);
            }
        }
        for(let commentId in articleInfo.comments){
            let commentInfo = articleInfo.comments[commentId];
            if(!commentInfo.owner || !commentInfo.creationAmount){
                throw new Error("Invalid comment " + commentInfo);
            }
            for(let boost of commentInfo.boosts){
                if(!boost.owner || !boost.amount){
                    throw new Error("Invalid boost owner" + boost.owner + " or " + boost.amount + " for comment " + commentId);
                }
            }
        }
    }
    function getArticleInfo(channelId, articleId){
        let articleInfo = values.channels[channelId].articles[articleId];
        checkArticleData(articleInfo);
        return articleInfo;
    }
    this.getArticleInfo = getArticleInfo;

    this.listASortedArticles = function listActiveArticles(channelId){
        return Object.keys(values.channels[channelId].sortedArticles);
    }

    function computeCommentWeight(channelId, articleId, commentId) {
        let commentInfo = getArticleInfo(channelId, articleId).comments[commentId];
        let weight = commentInfo.creationAmount;
        let timeFactor = (values._currentTick - commentInfo.creationTick) * getTickReduction(channelId);
        if(timeFactor <=0){
            timeFactor = 1;
        }
        weight = weight / timeFactor;
        for(let boost of getArticleInfo(channelId, articleId).comments[commentId].boosts){
            timeFactor = (values._currentTick - boost.creationTick) * getTickReduction(channelId);
            if(timeFactor <= 0 ){
                timeFactor = 1;
            }
            weight += boost.amount / timeFactor;
        }
        return weight;
    }

    function computeArticleWeight(channelId, articleId) {
        let articleInfo = getArticleInfo(channelId, articleId);
        let weight = articleInfo.creationAmount;
        let timeFactor = (values._currentTick - articleInfo.creationTick) * getTickReduction(channelId);
        if(timeFactor <= 0){
            timeFactor = 1;
        }
        weight = weight / timeFactor;
        for(let boost of getArticleInfo(channelId, articleId).boosts){
            timeFactor = (values._currentTick - boost.creationTick) * getTickReduction(channelId);
            if(timeFactor <= 0 ){
                timeFactor = 1;
            }
            weight += boost.amount / timeFactor;
        }
        for(let commentId in getArticleInfo(channelId, articleId).comments){
            weight += computeCommentWeight(channelId, articleId, commentId);
        }
        return weight;
    }
    function computeStakeHoldersPercent(chanelID, articleInfo){
        let alphaForQuadraticStakeComputation = getAlphaForQuadraticStakeDistribution(chanelID);
        console.debug(">>>>> Computing stake holders for ", articleInfo.id, " with alpha ", alphaForQuadraticStakeComputation);
        let stakeHolders = {};
        function computeArticleInvestment(articleId){
            let investment = articleInfo.creationAmount;
            for(let boost of articleInfo.boosts){
                investment += boost.amount;
            }
            for(let commentId in articleInfo.comments){
                let commentInfo = articleInfo.comments[commentId];
                investment += commentInfo.creationAmount;
                for(let boost of commentInfo.boosts){
                    investment += boost.amount;
                }
            }
            return investment;
        }

        if(!articleInfo){
            throw new Error("Invalid articleId ");
        }
        stakeHolders[articleInfo.owner] = articleInfo.creationAmount;
        for(let boost of articleInfo.boosts){
            if(!stakeHolders[boost.owner]){
                stakeHolders[boost.owner] = 0;
            }
            stakeHolders[boost.owner] += boost.amount;
        }
        for(let commentId in articleInfo.comments){
            let commentInfo = articleInfo.comments[commentId];
            if(!stakeHolders[commentInfo.owner]){
                stakeHolders[commentInfo.owner] = 0;
            }
            stakeHolders[commentInfo.owner] += commentInfo.creationAmount;
            for(let boost of commentInfo.boosts){
                if(!stakeHolders[boost.owner]){
                    stakeHolders[boost.owner] = 0;
                }
                stakeHolders[boost.owner] += boost.amount;
            }
        }

        let totalInvestment = computeArticleInvestment(articleInfo);
        let contributions = [];
        for(let stakeHolder in stakeHolders){
            contributions.push(stakeHolders[stakeHolder]);
        }
        //console.debug(">>>>> Contributions: ", contributions);
        let stakes = computeStakeSublinear( contributions, alphaForQuadraticStakeComputation);
        //console.debug(">>>> Stakes: ", stakes);
        for(let stakeHolder in stakeHolders){
            let stake = stakes.shift();
            if(isNaN(stake) || stake <= 0){
                throw new Error("Invalid stake " + stake);
            }
            stakeHolders[stakeHolder] = stake;
        }
        return stakeHolders;
    }

    function sortArticles(){
        for(let channelId in values.channels) {
            let channelInfo = values.channels[channelId];
            let allArticles = Object.keys(values.channels[channelId].articles);

            //console.log("# All Articles: ", allArticles.length);
            let sortedArticles = allArticles.map(articleId => {
                let articleInfo = channelInfo.articles[articleId];
                articleInfo.currentWeight = computeArticleWeight(channelId, articleId);
                articleInfo.currentStakeHolders = computeStakeHoldersPercent(channelId, articleInfo);
                return articleInfo;
            })

            //console.log("# Before sorting: ", sortedArticles.length);

            sortedArticles = sortedArticles.sort((a, b) => {
                return b.currentWeight - a.currentWeight;
            });

            //console.log("# Sorted articles: ", sortedArticles.length);
            //display score for each articleId
            /*sortedArticles.map(articleId => {
                if (articleId) {
                    console.debug("articleId " + articleId.id + " weight " + articleId.currentWeight);
                } else {
                    console.debug("articleId is null");
                }
            }); */
            values.channels[channelId].sortedArticles = sortedArticles;
        }
    }

    function computeLockedFunds(articleInfo){
        //similar with compute wight for comments and articleId sum all the investments for each user
        let stakeHolders = {};
        checkArticleData(articleInfo);
        stakeHolders[articleInfo.owner] = articleInfo.creationAmount;

        for(let boost of articleInfo.boosts){

            if(!boost.owner || !boost.amount){
                throw new Error("Invalid boost " + boost.owner + " " + boost.amount);
            }
            stakeHolders[boost.owner] = boost.amount;
        }
        for(let commentId in articleInfo.comments){
            let commentInfo = articleInfo.comments[commentId];
            stakeHolders[commentInfo.owner] = commentInfo.creationAmount;
            for(let boost of commentInfo.boosts){
                if(!boost.owner || !boost.amount){
                    throw new Error("Invalid boost " + boost);
                }
                stakeHolders[boost.owner] = boost.amount;
            }
        }
        return stakeHolders;
    }
    function pruneExcessArticles(){
        for(let channelId in values.channels) {
            let numberOfActiveArticles = getMaxNumberOfActiveArticlesInChannel(channelId);
            let channelInfo = values.channels[channelId];
            let sortedArticles = channelInfo.sortedArticles;
            let remove = sortedArticles.length - numberOfActiveArticles;
            let forDeactivation = [];
            if(remove > 0){
                forDeactivation = sortedArticles.slice(-remove);
            }
            sortedArticles = channelInfo.sortedArticles = sortedArticles.slice(0, numberOfActiveArticles);
            console.debug("Sorted articles: " + sortedArticles.length, " max possible ",numberOfActiveArticles, "for deactivation: ", forDeactivation.length);
            sortedArticles.map(articleInfo => {
                //console.debug("Active articleId: " + articleInfo.id, " weight: " + articleInfo.currentWeight);
                channelInfo.articles[articleInfo.id] = articleInfo;
            })
            let dumpListOFDeactivatedArticles = forDeactivation.map(articleInfo => {
                return articleInfo.id;
            });
            console.debug("\t\t\t Deactivating articles [ " + dumpListOFDeactivatedArticles.toString(), "] in tick ", values._currentTick);
            // unlock funds for deactivated articles
            for (let articleInfo of forDeactivation){
                checkArticleData(articleInfo);
                let stakeHolders = computeLockedFunds(articleInfo);
                console.debug("\t\t\tDeactivating article " + articleInfo.id, " with stake holders ", stakeHolders);
                for(let stakeHolder in stakeHolders){
                    persistence.unblockFunds(stakeHolder, stakeHolders[stakeHolder], " Deactivate article " + articleInfo.id);
                }
                delete channelInfo.articles[articleInfo.id];
            }
        }

    }


    function checkAllData() {
        for (let channelId in values.channels) {
            let channelInfo = values.channels[channelId];
            for (let articleId in channelInfo.articles) {
                let articleInfo = channelInfo.articles[articleId];
                if (articleInfo.id !== articleId || articleInfo.id === undefined) {
                    throw new Error("Invalid articleId " + articleId + " in articleInfo " + articleInfo.id);
                }
                for (let commentId in articleInfo.comments) {
                    let commentInfo = articleInfo.comments[commentId];
                    if (commentInfo.id !== commentId || commentInfo.id === undefined) {
                        throw new Error("Invalid commentId " + commentId + " in commentInfo " + commentInfo.id);
                    }
                    for (let boost of commentInfo.boosts) {
                        if (boost.owner === undefined || boost.amount === undefined) {
                            throw new Error("Invalid boost " + boost);
                        }
                    }
                }
            }
        }
    }
    function updateArticlesInfo(){
        for(let channelId in values.channels){
            let channelInfo = values.channels[channelId];
            let sortedArticles = channelInfo.sortedArticles;
            for(let i = 0; i < sortedArticles.length; i++){
                let articleInfo = sortedArticles[i];
                channelInfo.articles[articleInfo.id] = articleInfo; // update the article info to have the same values as in the sorted array
            }
        }
        checkAllData();
    }

    this.tickTack = function tick() { // planed ot be executed once per hour or each XX minutes, days, etc
        console.log("Tick..." + values._currentTick);
        //recompute weights for articles and comments, archive articles removed from storage,  compute new balances for users
        sortArticles();
        pruneExcessArticles();
        updateArticlesInfo();

        //prepare for reward distribution
        let allActiveArticlesGroupedByChannel = {};
        for(let channelId in values.channels){
            let channelInfo = values.channels[channelId];
            allActiveArticlesGroupedByChannel[channelId] = channelInfo.sortedArticles;
        }

        settings.rewardArticles(self, allActiveArticlesGroupedByChannel, values._currentTick);
        values._currentTick++;
        persistence.store(values);
    }

}


module.exports = {
    initialiseSpecificLogic: function(persistence){
        return new HatefinityLogic(persistence);
    }

}