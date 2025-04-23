async function Space(){
    let self = {};

    let persistence = await $$.loadPlugin("StandardPersistence");
    persistence.configureTypes({
        spaceStatus: {
            name: "string"
        }
    });

    await persistence.createIndex("spaceStatus", "name");

    self.listAllSpaces = async function(){
        return await persistence.getEverySpaceStatus();
    }
    self.createSpace = async function(spaceName){
        let spaceData = {
            name: spaceName
        }
        return await persistence.createSpaceStatus(spaceData);
    }
    self.deleteSpace = async function (email, authKey, spaceId) {
        // let userFile = await user.loadUser(email, authKey);
        // let spacesNr = Object.keys(userFile.spaces).length;
        // if (spacesNr === 1) {
        //     return "You can't delete your last space";
        // }
        // let spaceStatus = await getSpaceStatusObject(spaceId);
        // if (!spaceStatus.admins[email]) {
        //     return "You dont have permission to delete this space";
        // }
        // //unlink space from all users
        // for (let userId of Object.keys(spaceStatus.users)) {
        //     await user.unlinkSpaceFromUser(email, authKey, spaceId);
        // }
        // //delete space folder
        // let spacePath = getSpacePath(spaceId);
        // await fsPromises.rm(spacePath, {recursive: true, force: true});
        // //delete documents
        // let documentsList = await documentService.getDocuments(spaceId);
        // for (let document of documentsList) {
        //     await documentService.deleteDocument(spaceId, document.id);
        // }
        // //delete api keys
        // let keys = await secrets.getAPIKeys(spaceId);
        // for (let keyType in keys) {
        //     await secrets.deleteSpaceKey(spaceId, keyType);
        // }
    }

    self.getSpaceStatus = async function(spaceId){
        let spaceExists = await persistence.hasSpaceStatus(spaceId);
        if(spaceExists){
            return await persistence.getSpaceStatus(spaceId);
        }
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
            singletonInstance = await Space();
        }
        return singletonInstance;
    },
    getAllow: function(){
        return async function(id, name, command, ...args){
            return true;
        }
    },
    getDependencies: function(){
        return ["StandardPersistence"];
    }
}