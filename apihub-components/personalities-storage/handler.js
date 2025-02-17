const {createSpaceChat,getPersonalityData} = require('../spaces-storage/space.js').APIs;
const crypto = require("../apihub-component-utils/crypto");
const {promises: fsPromises} = require("fs");
const SubscriptionManager = require("../subscribers/SubscriptionManager");
const SpaceController = require("../spaces-storage/controller.js");

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

    await createSpaceChat(spaceId, personalityData.id);
}

async function addConversation(request,spaceId,personalityId){
    return await createSpaceChat(spaceId,personalityId);
}

async function getConversationIds(spaceId,personalityId){
    const personalityData = await getPersonalityData(spaceId,personalityId)
    return personalityData.chats;
}

module.exports = {
    addPersonality,
    addConversation,
    getConversationIds
}