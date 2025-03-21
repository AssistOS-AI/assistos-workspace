const {promises: fsPromises} = require("fs");
const crypto = require("../../apihub-component-utils/crypto");
const file = require("../../apihub-component-utils/file");
const path = require("path");
const volumeManager = require("../../volumeManager");
const constants = require("../../space/constants");
const secrets = require("../../apihub-component-utils/secrets");

async function SpacePlugin(){
    let self = {};
    let persistence = await $$.loadPlugin("SpacePersistence");
    self.createSpace = async function(server, spaceName, email, authKey){
        const User = require('../../users-storage/user.js');

        const defaultSpaceAgentId = crypto.generateId(16);
        let spaceData = {
            name: spaceName,
            users: [{email: email, role: constants.ROLES.OWNER}],
            applications: [],
            defaultAgent: defaultSpaceAgentId
        }
        let space = await persistence.createSpaceStatus(spaceData);
        //create serverless API for new space
        let serverlessAPIStorage = path.join(server.rootFolder, "external-volume", "spaces", space.id);
        let serverlessId = space.id;
        const serverlessAPI = await server.createServerlessAPI({
            urlPrefix: serverlessId,
            storage: serverlessAPIStorage});
        let serverUrl = serverlessAPI.getUrl();
        server.registerServerlessProcessUrl(serverlessId, serverUrl);

        //make space plugins available to the new serverless
        await fsPromises.mkdir(serverlessAPIStorage, {recursive: true});
        const SpacePluginRedirect = `module.exports = require("../../../../apihub-components/serverlessAPI/plugins/SpacePlugin.js")`;
        await fsPromises.writeFile(`${serverlessAPIStorage}/SpacePlugin.js`, SpacePluginRedirect);


        await secrets.createSpaceSecretsContainer(space.id);
        const spacePath = path.join(volumeManager.paths.space, space.id);
        await file.createDirectory(spacePath);
        await self.copyDefaultPersonalities(spacePath, space.id, defaultSpaceAgentId)
        await file.createDirectory(path.join(spacePath, 'applications'))
        await User.linkSpaceToUser(email, space.id, authKey)
        return space;
    }
    self.linkSpaceToUser = async function (email, spaceId, authKey) {
        let userInfo = await sendAuthComponentRequest(`getInfo/${email}`, 'GET', "", authKey, email);
        userInfo.currentSpaceId = spaceId;
        if(!userInfo.spaces){
            userInfo.spaces = [];
        }
        if(userInfo.spaces.includes(spaceId)){
            console.log(`User ${email} is already linked to space ${spaceId}`);
            return;
        }
        userInfo.spaces.push(spaceId);
        await sendAuthComponentRequest(`setInfo/${email}`, 'PUT', userInfo, authKey, email);
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