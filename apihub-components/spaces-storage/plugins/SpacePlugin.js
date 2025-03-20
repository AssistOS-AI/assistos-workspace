const {promises: fsPromises} = require("fs");
const crypto = require("../../apihub-component-utils/crypto");
const constants = require("../constants");
const file = require("../../apihub-component-utils/file");
const secrets = require("../../apihub-component-utils/secrets");
const path = require("path");
const volumeManager = require("../../volumeManager");

async function SpacePlugin(){
    let self = {};
    let persistence = await $$.loadPlugin("SpacePersistence");
    self.createSpace = async function(spaceName, email, authKey){
        const User = require('../../users-storage/user.js');

        const defaultSpaceAgentId = crypto.generateId(16);
        let spaceData = {
            name: spaceName,
            users: [{email: email, role: constants.ROLES.OWNER}],
            applications: [],
            defaultAgent: defaultSpaceAgentId
        }
        let space = await persistence.createSpaceStatus(spaceData);

        await secrets.createSpaceSecretsContainer(space.id);
        const spacePath = path.join(volumeManager.paths.space, space.id);
        await file.createDirectory(spacePath);
        await self.copyDefaultPersonalities(spacePath, space.id, defaultSpaceAgentId)
        await file.createDirectory(path.join(spacePath, 'applications'))
        await User.linkSpaceToUser(email, space.id, authKey)


        // const lightDBEnclaveClient = enclave.initialiseLightDBEnclave(space.id);
        // await $$.promisify(lightDBEnclaveClient.grantWriteAccess)($$.SYSTEM_IDENTIFIER);
        // await self.createDefaultSpaceChats(lightDBEnclaveClient, space.id);
        return space;
    }
    self.getSpace = async function(spaceId){
        let spaceExists = await persistence.hasSpaceStatus(spaceId);
        if(spaceExists){
            return await persistence.getSpaceStatus(spaceId);
        }
    }
    self.copyDefaultPersonalities = async function (spacePath, spaceId, defaultSpaceAgentId) {
        const defaultPersonalitiesPath = volumeManager.paths.defaultPersonalities;
        const personalitiesPath = path.join(spacePath, 'personalities');

        await file.createDirectory(personalitiesPath);
        const files = await fsPromises.readdir(defaultPersonalitiesPath, {withFileTypes: true});

        let promises = [];
        const defaultLlmsRes = await fetch(`${process.env.BASE_URL}/apis/v1/llms/defaults`);
        const defaultLlms = (await defaultLlmsRes.json()).data;

        for (const entry of files) {
            if (entry.isFile()) {
                promises.push(self.preparePersonalityData(defaultPersonalitiesPath, personalitiesPath, entry, spaceId, defaultSpaceAgentId, defaultLlms));
            }
        }
        const personalitiesData = await Promise.all(promises);

        await fsPromises.writeFile(path.join(spacePath, 'personalities', 'metadata.json'), JSON.stringify(personalitiesData), 'utf8');
    }
    self.preparePersonalityData = async function (defaultPersonalitiesPath, personalitiesPath, entry, spaceId, defaultSpaceAgentId, defaultLlms) {
        const filePath = path.join(defaultPersonalitiesPath, entry.name);
        let personality = JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
        personality.llms = defaultLlms;
        if (personality.name === "Assistant") {
            personality.id = defaultSpaceAgentId;
        } else {
            personality.id = crypto.generateId(16);
        }
        let imagesPath = path.join(defaultPersonalitiesPath, 'images');
        let imageBuffer = await fsPromises.readFile(path.join(imagesPath, `${personality.imageId}.png`));

        //personality.imageId = await spaceModule.putImage(imageBuffer);
        await fsPromises.writeFile(path.join(personalitiesPath, `${personality.id}.json`), JSON.stringify(personality), 'utf8');

        return {
            id: personality.id,
            name: personality.name,
            imageId: personality.imageId,
        };
    }
    self.getSpaceAgent = async function (spaceId, agentId) {
        try {
            const agentPath = getAgentPath(spaceId, agentId);
            const agentObj = JSON.parse(await fsPromises.readFile(agentPath, 'utf8'));
            return agentObj;
        } catch (error) {
            error.message = `Agent ${agentId} not found.`;
            error.statusCode = 404;
            throw error;
        }
    }

    self.getDefaultSpaceAgentId = async function (spaceId) {
        let spaceStatus = await persistence.getSpaceStatus(spaceId);
        return spaceStatus.defaultSpaceAgent;
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