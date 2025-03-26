const {getPersonalityData, getSpacePersonalities} = require('../globalServerlessAPI/space.js').APIs;
const {createChat} = require('../chat/handler.js');
const crypto = require("../apihub-component-utils/crypto");
const storage=require('../apihub-component-utils/storage');
const {promises: fsPromises} = require("fs");
const SubscriptionManager = require("../subscribers/SubscriptionManager");
const SpaceController = require("../globalServerlessAPI/controller.js");

async function addPersonality(request, spaceId, personalityData) {
    const objectId = crypto.generateId();
    personalityData.id = objectId;
    let metaObj = {};
    for (let key of personalityData.metadata) {
        metaObj[key] = personalityData[key];
    }
    let metadataPath = SpaceController.getFileObjectsMetadataPath(spaceId, "personalities");

    let metadata = JSON.parse(await fsPromises.readFile(metadataPath, {encoding: 'utf8'}));
    metadata.push(metaObj);
    await fsPromises.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

    let filePath = SpaceController.getFileObjectPath(spaceId, "personalities", objectId);
    await fsPromises.writeFile(filePath, JSON.stringify(personalityData, null, 2), 'utf8');

    SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, "personalities"));
    SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectId));

    await createChat(spaceId, personalityData.id);
}

async function addConversation(spaceId, personalityId) {
    return await createChat(spaceId, personalityId);
}

async function getConversationIds(spaceId, personalityId) {
    const personalityData = await getPersonalityData(spaceId, personalityId)
    return personalityData.chats;
}

async function ensurePersonalityChat(spaceId, personalityId) {
    const personalityData = await getPersonalityData(spaceId, personalityId)
    if (personalityData.chats === undefined) {
        await addConversation(spaceId, personalityId)
    }
}

async function ensurePersonalityChats(spaceId) {
    const spacePersonalities = await getSpacePersonalities(spaceId);
    for (const personality of spacePersonalities) {
        await ensurePersonalityChat(spaceId, personality.id);
    }
}

async function getPersonality(spaceId, personalityId) {
    return await getPersonalityData(spaceId, personalityId);
}

async function getPersonalityImageUrl(spaceId, personalityId) {
    const personalityData = await getPersonalityData(spaceId, personalityId);
    const imageId = personalityData.imageId;
    return await storage.getDownloadURL("image/png", imageId);
}

module.exports = {
    addPersonality,
    addConversation,
    getConversationIds,
    ensurePersonalityChats,
    getPersonality,
    getPersonalityImageUrl
}