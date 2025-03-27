async function SpacePlugin(){
    let self = {};
    let persistence = await $$.loadPlugin("SpacePersistence");
    self.listAllSpaces = async function(){
        return await persistence.getEverySpaceStatus();
    }
    self.createSpace = async function(spaceName){
        let spaceData = {
            name: spaceName
        }
        let space;
        try {
            space = await persistence.createSpaceStatus(spaceData);
        } catch (e) {
            return {
                status: "failed",
                reason: "Space with this name already exists"
            }
        }
        return {
            status: "success",
            space: space
        };
    }

    self.getSpaceStatus = async function(spaceId){
        let spaceExists = await persistence.hasSpaceStatus(spaceId);
        if(spaceExists){
            return await persistence.getSpaceStatus(spaceId);
        }
    }

    self.linkUserToSpace = async function(spaceId, userId, referrerId, role) {
        const spaceStatus = await persistence.getSpaceStatus(spaceId);
        if (spaceStatus.users[userId]) {
            return {
                status: "failed",
                reason: "user already linked to space",
            }
        }
        spaceStatus.users[userId] = {
                roles: [role],
                referrerId: referrerId,
                joinDate: Date.now(),
            }
        await persistence.updateSpaceStatus(spaceId, spaceStatus);
    }

    self.getDefaultSpaceAgentId = async function (spaceId) {
        let spaceStatus = await persistence.getSpaceStatus(spaceId);
        return spaceStatus.defaultAgent;
    }
    self.getSpaceStatus = async function (spaceId) {
        return await persistence.getSpaceStatus(spaceId);
    }
    self.shutDown = async function(){
        await persistence.shutDown();
    }
    return self;
}

let singletonInstance = undefined;

module.exports = {
    getInstance: async function () {
        if(!singletonInstance){
            singletonInstance = await SpacePlugin();
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