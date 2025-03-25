const persisto = require("../../Gatekeeper/Persisto");
async function SpacePersistence(){
    let persistence = await persisto.initialisePersisto();
    persistence.configureTypes({
        spaceStatus: {
           users: "array",
            name: "string",
            applications: "array",
            defaultAgent: "string",
        },
        application: {
            name: "string",
        },
        personality: {
            name: "string",
            imageId: "string",
            description: "string",
            llms: "object",
        }
    });

    await persistence.createIndex("spaceStatus", "name");
    await persistence.createIndex("application", "name");
    await persistence.createIndex("personality", "name");
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