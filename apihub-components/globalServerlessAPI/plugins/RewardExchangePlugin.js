async function RewardExchangePlugin(){
    let self = {};
    self.rewardUser = async function (userID, invitingUserID) {
        return true;
    }
    return self;
}
let singletonInstance = undefined;
module.exports = {
    getInstance: async function () {
        if (!singletonInstance) {
            singletonInstance = await RewardExchangePlugin();
        }
        return singletonInstance;
    },
    getAllow: function () {
        return async function (globalUserId, email, command, ...args) {
            return false;
        }
    },

}