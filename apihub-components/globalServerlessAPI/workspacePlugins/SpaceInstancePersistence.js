async function SpaceInstancePersistence(){
    //workspacePersistence
    let persistence = await $$.loadPlugin("DefaultPersistence");
    persistence.configureTypes({
        application: {
            name: "string",
            lastUpdate: "string"
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