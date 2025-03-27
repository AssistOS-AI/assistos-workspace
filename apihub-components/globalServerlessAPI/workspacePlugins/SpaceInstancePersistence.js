const path = require("path");
async function SpaceInstancePersistence(){
    // process.env.process.env.PERSISTENCE_FOLDER = path.join(server.rootFolder, "external-volume", "spaces");
    let persistence = await $$.loadPlugin("DefaultPersistence");
    persistence.configureTypes({
        application: {
            name: "string",
        }
    });

    await persistence.createIndex("application", "name");
    return persistence;
}

module.exports = {
    getInstance: async function () {
         return await SpaceInstancePersistence();
    },
    getAllow: function(){
        return async function(globalUserId, email, command, ...args){
            return false;
        }
    },
    getDependencies: function(){
        return ["DefaultPersistence"];
    }
}