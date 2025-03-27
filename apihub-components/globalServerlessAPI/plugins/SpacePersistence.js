const persisto = require("../../Gatekeeper/Persisto");
async function SpacePersistence(){
    let persistence = await persisto.initialisePersisto();
    persistence.configureTypes({
        spaceStatus: {
            name: "string"
        }
    });

    await persistence.createIndex("spaceStatus", "name");
    return persistence;
}

let singleton = null;

module.exports = {
    getInstance: async function () {
        if(!singleton){
            singleton = await SpacePersistence();
        }
        return singleton;
    },
    getAllow: function(){
        return async function(globalUserId, email, command, ...args){
            return false;
        }
    }
}