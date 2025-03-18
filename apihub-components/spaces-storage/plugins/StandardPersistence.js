const persisto = require("../../Gatekeeper/Persisto");
async function createStandardPersistencePlugin(){
    let persistence = await persisto.initialisePersisto();
    persistence.configureTypes({
        space: {
           users: "array",
            name: "string",
            applications: "array",
            defaultAgent: "string",
        },
    });

    await persistence.createIndex("space", "name");

    return persistence;
}

let singleton = null;

module.exports = {
    getInstance: async function () {
        if(!singleton){
            singleton = await createStandardPersistencePlugin();
        }
        return singleton;
    },
    getAllow: function(){
        return async function(globalUserId, email, command, ...args){
            return false;
        }
    }
}