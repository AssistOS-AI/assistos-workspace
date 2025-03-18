const {promises: fsPromises} = require("fs");
const crypto = require("../../apihub-component-utils/crypto");
const constants = require("../constants");
const file = require("../../apihub-component-utils/file");
const secrets = require("../../apihub-component-utils/secrets");
const path = require("path");
const User = require("../../users-storage/user");
const volumeManager = require("../../volumeManager");
const cookie = require("../../apihub-component-utils/cookie");

async function SpacePlugin(){
    let self = {};
    let persistence = await $$.loadPlugin("StandardPersistence");
    self.createSpace = async function(email, name){
        const User = require('../users-storage/user.js');
        const rollback = async (spacePath) => {
            try {
                await fsPromises.rm(spacePath, {recursive: true, force: true});
            } catch (error) {
                console.error(`Failed to clean up space directory at ${spacePath}: ${error}`);
                throw error;
            }
        };
        const defaultSpaceAgentId = crypto.generateId(16);
        let spaceData = {
            name: name,
            users: [{email: email, role: constants.ROLES.OWNER}],
            applications: [],
            defaultAgent: defaultSpaceAgentId
        }
        let space = await persistence.createSpace(spaceData);

        await secrets.createSpaceSecretsContainer(spaceId);

        const filesPromises = [
            () => copyDefaultPersonalities(spacePath, space.spaceId, defaultSpaceAgentId),
            () => file.createDirectory(path.join(spacePath, 'applications')),
            () => User.linkSpaceToUser(email, spaceId, authKey),
            () => addSpaceToSpaceMap(spaceId, spaceName),
        ];

        const results = await Promise.allSettled(filesPromises.map(fn => fn()));
        const failed = results.filter(r => r.status === 'rejected');

        if (failed.length > 0) {
            await rollback(spacePath);
            throw new Error(failed.map(op => op.reason?.message || 'Unknown error').join(', '));
        }
        const lightDBEnclaveClient = enclave.initialiseLightDBEnclave(space.id);
        await $$.promisify(lightDBEnclaveClient.grantWriteAccess)($$.SYSTEM_IDENTIFIER);
        await createDefaultSpaceChats(lightDBEnclaveClient, space.id);
        return space;
    }
    self.copyDefaultPersonalities = async function (spacePath, spaceId, defaultSpaceAgentId) {
        const defaultPersonalitiesPath = volumeManager.paths.defaultPersonalities;
        const personalitiesPath = path.join(spacePath, 'personalities');

        await file.createDirectory(personalitiesPath);
        const files = await fsPromises.readdir(defaultPersonalitiesPath, {withFileTypes: true});

        let promises = [];
        const defaultLlmsRes = await fetch(`${process.env.BASE_URL}/apis/v1/llms/defaults`);
        const defaultLlms = (await defaultLlmsRes.json()).data;
        let authSecret = await secrets.getApiHubAuthSecret();
        let securityContextConfig = {
            headers: {
                cookie: cookie.createApiHubAuthCookies(authSecret, "", spaceId)
            }
        }
        const SecurityContext = require('assistos').ServerSideSecurityContext;
        let securityContext = new SecurityContext(securityContextConfig);
        let spaceModule = require('assistos').loadModule('space', securityContext);
        for (const entry of files) {
            if (entry.isFile()) {
                promises.push(self.preparePersonalityData(defaultPersonalitiesPath, personalitiesPath, entry, spaceId, defaultSpaceAgentId, defaultLlms, spaceModule));
            }
        }
        const personalitiesData = await Promise.all(promises);

        await Promise.all(personalitiesData.map(personalityData => createChat(spaceId, personalityData.id)));
        await fsPromises.writeFile(path.join(spacePath, 'personalities', 'metadata.json'), JSON.stringify(personalitiesData), 'utf8');
    }
    self.preparePersonalityData = async function (defaultPersonalitiesPath, personalitiesPath, entry, spaceId, defaultSpaceAgentId, defaultLlms, spaceModule) {
        const filePath = path.join(defaultPersonalitiesPath, entry.name);
        let personality = JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
        const constants = require("assistos").constants;
        personality.llms = defaultLlms;
        if (personality.name === constants.DEFAULT_PERSONALITY_NAME) {
            personality.id = defaultSpaceAgentId;
        } else {
            personality.id = crypto.generateId(16);
        }
        let imagesPath = path.join(defaultPersonalitiesPath, 'images');
        let imageBuffer = await fsPromises.readFile(path.join(imagesPath, `${personality.imageId}.png`));

        personality.imageId = await spaceModule.putImage(imageBuffer);
        await fsPromises.writeFile(path.join(personalitiesPath, `${personality.id}.json`), JSON.stringify(personality), 'utf8');

        return {
            id: personality.id,
            name: personality.name,
            imageId: personality.imageId,
        };
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
        return ["StandardPersistence"];
    }
}