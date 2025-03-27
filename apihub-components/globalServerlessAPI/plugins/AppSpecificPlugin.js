async function AppSpecificPlugin() {
    let self = {};
    let spacePersistence = await $$.loadPlugin("SpacePersistence");
    self.rewardUser = async function(user, referrerId){
        return true;
    }
    self.linkSpaceToUser = async function (email, spaceId) {
        let UserLogin = await $$.loadPlugin("UserLogin");

        let result = await UserLogin.getUserInfo(email);
        let userInfo = result.userInfo;
        userInfo.currentSpaceId = spaceId;
        if(!userInfo.spaces){
            userInfo.spaces = [];
        }
        if(userInfo.spaces.includes(spaceId)){
            console.log(`User ${email} is already linked to space ${spaceId}`);
            return;
        }
        userInfo.spaces.push(spaceId);
        await UserLogin.setUserInfo(email, userInfo);
    }
    self.addSpaceToUsers = async function(userEmails, spaceId){
        let UserLogin = await $$.loadPlugin("UserLogin");

        for(let email of userEmails){
            let result = await UserLogin.getUserInfo(email);
            if(result.status === "success"){
                if(!result.userInfo.spaces.includes(spaceId)){
                    result.userInfo.spaces.push(spaceId);
                }
                await UserLogin.setUserInfo(email, result.userInfo);
            } else {
                throw new Error(result.reason);
            }
        }
    }
    self.unlinkSpaceFromUser = async function (email, spaceId) {
        let UserLogin = await $$.loadPlugin("UserLogin");

        let userInfo = UserLogin.getUserInfo(email);
        userInfo.spaces = userInfo.spaces.filter(id => id !== spaceId);
        if (userInfo.currentSpaceId === spaceId) {
            userInfo.currentSpaceId = userInfo.spaces.length > 0 ? userInfo.spaces[0] : null;
        }
        await UserLogin.setUserInfo(email, userInfo);
    }
    self.getDefaultSpaceId = async function(email) {
        let UserLogin = await $$.loadPlugin("UserLogin");

        let result = await UserLogin.getUserInfo(email);
        return result.userInfo.currentSpaceId;
    }
    self.setUserCurrentSpace = async function (email, spaceId) {
        let UserLogin = await $$.loadPlugin("UserLogin");

        let result = await UserLogin.getUserInfo(email);
        result.userInfo.currentSpaceId = spaceId;
        await UserLogin.setUserInfo(email, result.userInfo);
    }
    self.listUserSpaces = async function(email) {
        let UserLogin = await $$.loadPlugin("UserLogin");
        let result = await UserLogin.getUserInfo(email);
        let userInfo = result.userInfo;
        let spaces = [];
        if(userInfo.spaces){
            for(let spaceId of userInfo.spaces){
                let space = await spacePersistence.getSpaceStatus(spaceId);
                spaces.push({id: spaceId, name: space.name});
            }
        }
        return spaces;
    }
    return self;
}

let singletonInstance;
module.exports = {
    getInstance: async function () {
        if(!singletonInstance){
            singletonInstance = await AppSpecificPlugin();
        }
        return singletonInstance;
    },
    getAllow: function(){
        return async function(id, name, command, ...args){
            return true;
        }
    },
    getDependencies: function(){
        return ["SpacePersistence"];
    }
}

