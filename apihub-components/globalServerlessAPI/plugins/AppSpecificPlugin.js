async function AppSpecificPlugin() {
    let self = {};

    let persistence = await $$.loadPlugin("StandardPersistence");

    self.rewardUser = async function (user, referrerId) {
        return true;
    }
    self.listAllSpaces = async function(){
        return await persistence.getEverySpaceStatus();
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
        return ["StandardPersistence"];
    }
}
