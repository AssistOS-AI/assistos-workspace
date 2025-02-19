const SpaceHandler = require('../spaces-storage/space.js');
const PersonalitiesHandler = require('../personalities-storage/handler.js');
const Request = require('../apihub-component-utils/utils.js');
const {ServerSideSecurityContext, loadModule} = require('assistos');

async function ensurePersonalitiesDefaultLllms(request, response) {
    try {
        const spaceId = request.params.spaceId;
        const personalities = await SpaceHandler.APIs.getSpacePersonalitiesObject(spaceId);

        const notUpdatedPersonalities = personalities.filter(personality => !personality.llms || !personality.metadata);

        if (notUpdatedPersonalities.length === 0) {
            return Request.sendResponse(response, 200, "application/json", {message: "All personalities have default llms"});
        }

        const defaultLlmsRes = await fetch(`${process.env.BASE_URL}/apis/v1/llms/defaults`);
        if (!defaultLlmsRes.ok) {
            return Request.sendResponse(response, 500, "application/json", {message: "Failed to fetch default LLMs"});
        }

        const defaultLlms = (await defaultLlmsRes.json()).data;
        notUpdatedPersonalities.forEach(personality => {
            personality.llms = defaultLlms;
            personality.metadata = [
                "id",
                "name",
                "imageId"
            ]
        });

        const securityContext = new ServerSideSecurityContext(request);
        const personalityModule = loadModule("personality", securityContext);
        for (const personality of notUpdatedPersonalities) {
            await personalityModule.updatePersonality(spaceId, personality.id, personality);
        }
        return Request.sendResponse(response, 200, "application/json", {message: "Personalities updated with default llms"});
    } catch (error) {
        return Request.sendResponse(response, 500, "application/json", {message: `An error occurred while updating personalities:${error.message}`});
    }
}

async function getDefaultPersonality(request, response) {
    try {
        const spaceId = request.params.spaceId;
        const personality = await SpaceHandler.APIs.getDefaultPersonality(spaceId);
        return Request.sendResponse(response, 200, "application/json", {data: personality});
    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {message: `An error occurred while updating personalities:${error.message}`});
    }
}

async function addPersonality(request, response) {
    try {
        const spaceId = request.params.spaceId;
        const personalityData = request.body;
        await PersonalitiesHandler.addPersonality(request, spaceId, personalityData);

        return Request.sendResponse(response, 200, "application/json", {message: "Personality added successfully"});
    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {message: `An error occurred while updating personalities:${error.message}`});
    }

}

async function createConversation(request, response) {
    try {
        const spaceId = request.params.spaceId;
        const personalityId = request.params.personalityId;
        const conversationId = await PersonalitiesHandler.addConversation(spaceId, personalityId);
        return Request.sendResponse(response, 200, "application/json", {message: `Conversation ${conversationId} created`,data:conversationId});
    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {message: `An error occurred while creating a new conversation`});
    }
}

async function ensurePersonalityChats(request,response){
    try{
        const spaceId = request.params.spaceId;
        await PersonalitiesHandler.ensurePersonalityChats(spaceId);
        return Request.sendResponse(response, 200, "application/json", {message: `Personality chats created successfully`});
    }   catch(error){
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {message: `An error occurred while ensuring default chatserror`+error.message});
    }
}

async function getConversationIds(request,response){
    try{
        const spaceId= request.params.spaceId;
        const personalityId=request.params.personalityId;
        const conversationIds = await PersonalitiesHandler.getConversationIds(spaceId,personalityId);
        return Request.sendResponse(response,200,"application/json",{data:conversationIds})
    }   catch(error){
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {message: `An error occurred while fetching conversation Ids`});
    }
}
module.exports = {
    ensurePersonalitiesDefaultLllms,
    getDefaultPersonality,
    addPersonality,
    createConversation,
    getConversationIds,
    ensurePersonalityChats
};
