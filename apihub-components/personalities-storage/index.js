const bodyReader=require("../apihub-component-middlewares/bodyReader");
const {
    ensurePersonalitiesDefaultLllms,
    getDefaultPersonality,
    addPersonality,
    createConversation,
    getConversationIds,
    ensurePersonalityChats,
    getPersonality
} = require("./controller");

function PersonalitiesStorage(server){
    server.use("/personalities/*", bodyReader);
    server.get("/personalities/default/:spaceId",getDefaultPersonality);
    server.post("/personalities/:spaceId",addPersonality);
    server.get("/personalities/:spaceId/:personalityId",getPersonality);
    server.post("/personalities/chats/:spaceId/:personalityId",createConversation)
    server.get("/personalities/chats/:spaceId/:personalityId",getConversationIds)

    /* TODO Temporary Quick Fixes to handle model logic changes */

    server.post("/personalities/:spaceId/ensure-default-llms",ensurePersonalitiesDefaultLllms);
    server.get("/ensure-personality-chats/personalities/:spaceId",ensurePersonalityChats)
}

module.exports = PersonalitiesStorage;