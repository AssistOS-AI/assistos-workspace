async function SpaceInstancePersistence(){
    //workspacePersistence
    let persistence = await $$.loadPlugin("DefaultPersistence");

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