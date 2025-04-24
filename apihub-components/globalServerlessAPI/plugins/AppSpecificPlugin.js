async function AppSpecificPlugin() {
    let self = {};
    self.rewardUser = async function (user, referrerId) {
        return true;
    }
    return self;
}

let singletonInstance = undefined;

module.exports = {
    getInstance: async function () {
        if (!singletonInstance) {
            singletonInstance = await AppSpecificPlugin();
        }
        return singletonInstance;
    },
    getAllow: function () {
        return async function (globalUserId, email, command, ...args) {
            return true;
        }
    },
    getDependencies: function () {
        return [];
    }
}
