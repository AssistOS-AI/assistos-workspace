const crypto = require("../../apihub-component-utils/crypto");
const constants = require("../../space/constants");
const secrets = require("../../apihub-component-utils/secrets");
const path = require("path");
const volumeManager = require("../../volumeManager");
const file = require("../../apihub-component-utils/file");
const fsPromises = require("fs").promises;
async function AppSpecificPlugin() {
    let self = {};

    self.rewardUser = async function(user, referrerId){
        return true;
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

