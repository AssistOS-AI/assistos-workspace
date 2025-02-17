



const SYSTEM_ACCOUNT = "S000-0000";
const FOUNDERS_AGENT_ACCOUNT = "A000-0000";

const constants =  require('./assistosConstants.js');
const persistenceModule = require('../../persistence/FSPersistence.js');


const autoSaver =  persistenceModule.createAutoSaver(10000, {
        UsersInfo: {},
        AccountsLockedPoints: {},
        AccountsBalance: {
            "S000-0000": constants.MAX_NUMBER_OF_TOKENS - constants.FOUNDER_REWARD,
            "A000-0000": constants.FOUNDER_REWARD
        },
        ChannelsStatus: {
            mintedBalance: 0,
            channels: {},
            _currentTick: 0,
            _numberOfAccounts: 1024,  //reserve first 1024 user ids for special purposes
        },
        AgentsOwnership: {}
    }); // save only once per 10 seconds

let persistence = persistenceModule.createBasicPersistence({
    _storeChannelsInfo: async function (values) {
        autoSaver.setChannelsStatus(values);
        autoSaver.saveChannelsStatus()
    },
    _loadChannelsInfo: async function () {
        return autoSaver.getChannelsStatus();
    },
    _createAccount: async function (account) {
        if (!account.id) {
            throw new Error("Account info is invalid");
        }
        if (autoSaver.getUsersInfo()[account.id]) {
            throw new Error("Account " + account.id + " already exists ");
        }
        autoSaver.getChannelsStatus()._numberOfAccounts++;
        account.accountNumber = autoSaver.getChannelsStatus()._numberOfAccounts;
        autoSaver.getUsersInfo()[account.id] = JSON.stringify(account);
        autoSaver.getAccountsBalance()[account.id] = 0;
        autoSaver.getAccountsLockedPoints[account.id] = 0;
        autoSaver.saveAccountsBalance();
        autoSaver.saveAccountsLockedPoints();
        autoSaver.saveUsersInfo()
        return account;
    },
    _createChannelAccount: function () {
        autoSaver.getChannelsStatus()._numberOfAccounts++;
    },
    _createAgentAccount: function () {
        autoSaver.getChannelsStatus()._numberOfAccounts++;
    },
    _updateAccount: async function (accountID, values) {
        if (values.id != accountID) {
            throw new Error("Account not found or invalid");
        }
        autoSaver.getUsersInfo()[accountID] = JSON.stringify(values);
        autoSaver.saveUsersInfo()
        return values;
    },
    _getAccount: async function(accountID){
        if(!autoSaver.getUsersInfo()[accountID]){
            throw new Error("Account not found " + accountID);
        }
        return JSON.parse(autoSaver.getUsersInfo()[accountID]);
    },
    _getOwner: function (agentID) {
        return autoSaver.getAgentsOwnership[agentID];
    },
    _setOwner: function (agentID, ownerID) {
        autoSaver.getAgentsOwnership[agentID] = ownerID;
        autoSaver.saveAgentsOwnership();
    },
    _getNumberOfAccounts: function () {
        return autoSaver.getChannelsStatus()._numberOfAccounts;
    },
    _balanceTransferSync: function (accountIDFrom, accountIDTo, amount) {
        //console.debug("Transferring ", amount, " From  ", accountIDFrom, " with balance ",  autoSaver.getAccountsBalance()[accountIDFrom], " To ", accountIDTo, " with balance ", autoSaver.getAccountsBalance()[accountIDTo]);
        if (!autoSaver.getAccountsBalance()[accountIDFrom]) {
            autoSaver.getAccountsBalance()[accountIDFrom] = 0;
        }
        if (!autoSaver.getAccountsBalance()[accountIDTo]) {
            autoSaver.getAccountsBalance()[accountIDTo] = 0;
        }
        if (autoSaver.getAccountsBalance()[accountIDFrom] < amount) {
            console.debug("Insufficient funds ", autoSaver.getAccountsBalance()[accountIDFrom], " < ", amount, " for account ", accountIDFrom);
            throw new Error("Insufficient funds in account " + accountIDFrom);
        }
        autoSaver.getAccountsBalance()[accountIDFrom] -= amount;
        autoSaver.getAccountsBalance()[accountIDTo] += amount;
        //console.debug("Transferred ", amount, " from ", accountIDFrom, " to ", accountIDTo, " New balance for ", accountIDTo, " is " , autoSaver.getAccountsBalance()[accountIDTo], " Ramining for ", accountIDFrom, " ",  autoSaver.getAccountsBalance()[accountIDFrom]);
        autoSaver.saveAccountsBalance();
        return true;
    },
    _getBalanceSync: function (accountID) {
        if (!autoSaver.getAccountsBalance()[accountID]) {
            autoSaver.getAccountsBalance()[accountID] = 0;
        }
        return autoSaver.getAccountsBalance()[accountID];
    },
    _getLockedBalanceSync: function (accountID) {
        if (!autoSaver.getAccountsLockedPoints()[accountID]) {
            autoSaver.getAccountsLockedPoints()[accountID] = 0;
        }
        return autoSaver.getAccountsLockedPoints()[accountID];
    },

    _mintSync: function (amount, whyLog) {
        throw new Error("Minting is not allowed in the current setup");
        //return true;
    },
    _blockFundsSync: function (accountID, amount) {
        if (!autoSaver.getAccountsLockedPoints[accountID]) {
            autoSaver.getAccountsLockedPoints[accountID] = 0;
        }
        if (!autoSaver.getAccountsBalance()[accountID] || autoSaver.getAccountsBalance()[accountID] < amount) {
            throw new Error("Insufficient funds to block for " + accountID + " just " + autoSaver.getAccountsBalance()[accountID],);
        }
        autoSaver.getAccountsLockedPoints[accountID] += amount;
        autoSaver.getAccountsBalance()[accountID] -= amount;
        autoSaver.saveAccountsBalance();
        autoSaver.saveAccountsLockedPoints();
        return true;
    },
    _unblockFundsSync: function (accountID, amount) {
        if (!autoSaver.getAccountsLockedPoints[accountID]) {
            autoSaver.getAccountsLockedPoints[accountID] = 0;
        }
        if (!autoSaver.getAccountsLockedPoints[accountID] || autoSaver.getAccountsLockedPoints[accountID] < amount) {
            console.log(">>>>>>>>\tInsufficient funds to release for " + accountID + " just " + autoSaver.getAccountsLockedPoints[accountID]);
            throw new Error("Insufficient funds to release for " + accountID);
        }
        autoSaver.getAccountsLockedPoints[accountID] -= amount;
        autoSaver.getAccountsBalance()[accountID] += amount;
        autoSaver.saveAccountsBalance();
        autoSaver.saveAccountsLockedPoints();
        return true;
    }
});

module.exports = {
    initialisePersistence: function () {
        persistence.autoSaver = autoSaver;
        return persistence;
    }
}
