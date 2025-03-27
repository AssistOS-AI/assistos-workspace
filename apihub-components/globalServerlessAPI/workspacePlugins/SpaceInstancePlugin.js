async function SpaceInstancePlugin(){
    let self = {};
    let persistence = await $$.loadPlugin("SpaceInstancePersistence");
    let Workspace = await $$.loadPlugin("WorkspacePlugin");
    return self;
}

let singletonInstance = undefined;

module.exports = {
    getInstance: async function () {
        if(!singletonInstance){
            singletonInstance = await SpaceInstancePlugin();
        }
        return singletonInstance;
    },
    getAllow: function(){
        return async function(id, name, command, ...args){
            return true;
        }
    },
    getDependencies: function(){
        return ["SpaceInstancePersistence"];
    }
}