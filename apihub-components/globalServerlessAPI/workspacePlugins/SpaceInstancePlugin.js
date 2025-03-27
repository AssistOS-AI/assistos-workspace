async function SpaceInstancePlugin(){
    let self = {};
    let persistence = await $$.loadPlugin("SpaceInstancePersistence");
    let Workspace = await $$.loadPlugin("WorkspacePlugin");
    let WorkspaceUser = await $$.loadPlugin("WorkspaceUser");
    self.getSpaceCollaborators = async function () {
        const userIds = await WorkspaceUser.getAllUsers();
        let users = [];
        for (let userId of userIds) {
            let user = await WorkspaceUser.getUser(userId);
            users.push(user);
        }
        return users;
    }
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
        return ["SpaceInstancePersistence", "WorkspacePlugin", "WorkspaceUser"];
    }
}