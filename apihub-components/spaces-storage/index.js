const {
    getFileObjectsMetadata,
    getFileObject,
    addFileObject,
    updateFileObject,
    deleteFileObject,
    getContainerObjectsMetadata,
    getContainerObject,
    addContainerObject,
    updateContainerObject,
    deleteContainerObject,
    getEmbeddedObject,
    addEmbeddedObject,
    updateEmbeddedObject,
    deleteEmbeddedObject,
    swapEmbeddedObjects,
    getSpace,
    createSpace,
    addCollaboratorsToSpace,
    getAgent,
    addSpaceChatMessage,
    rejectSpaceInvitation,
    acceptSpaceInvitation,
    editAPIKey,
    deleteAPIKey,
    getAPIKeysMetadata,
    addSpaceAnnouncement,
    getSpaceAnnouncement,
    getSpaceAnnouncements,
    updateSpaceAnnouncement,
    deleteSpaceAnnouncement,
    getChatTextResponse,
    getChatTextStreamingResponse,
    getChatImageResponse,
    editChatImage,
    getChatImageVariants,
    getChatVideoResponse,
    storeImage,
    getImage,
    deleteImage,
    storeAudio,
    deleteAudio,
    getAudio,
    deleteVideo,
    exportDocument,
    importDocument,
    exportPersonality,
    importPersonality,
    getVideo,
    estimateDocumentVideoLength
} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')

function SpaceStorage(server) {
    server.head("/spaces/audio/:spaceId/:audioId",getAudio);
    server.head("/spaces/image/:spaceId/:imageId",getImage);
    server.head("/spaces/video/:spaceId/:videoId",getVideo);

    server.get("/spaces/audio/:spaceId/:audioId", getAudio);
    server.get("/spaces/image/:spaceId/:imageId", getImage);
    server.get("/spaces/video/:spaceId/:videoId", getVideo);

    server.use("/spaces/*", bodyReader);
    server.use("/apis/v1/spaces/*", bodyReader);
    /* invitations */
    server.get("/spaces/invitations/reject", rejectSpaceInvitation);
    server.get("/spaces/invitations/accept", acceptSpaceInvitation);

    server.use("/spaces/*", authentication);

    server.get("/spaces", getSpace);
    server.get("/spaces/:spaceId", getSpace);

    server.post("/spaces", createSpace);

    server.get("/spaces/:spaceId/agents", getAgent)
    server.get("/spaces/:spaceId/agents/:agentId", getAgent)

    server.get("/spaces/fileObject/:spaceId/:objectType", getFileObjectsMetadata);
    server.get("/spaces/fileObject/:spaceId/:objectType/:objectId", getFileObject);
    server.post("/spaces/fileObject/:spaceId/:objectType", addFileObject);
    server.put("/spaces/fileObject/:spaceId/:objectType/:objectId", updateFileObject);
    server.delete("/spaces/fileObject/:spaceId/:objectType/:objectId", deleteFileObject);

    server.get("/spaces/containerObject/meta/:spaceId/:objectType", getContainerObjectsMetadata);
    server.get("/spaces/containerObject/:spaceId/:objectId", getContainerObject);
    server.post("/spaces/containerObject/:spaceId/:objectType", addContainerObject);
    server.put("/spaces/containerObject/:spaceId/:objectId", updateContainerObject);
    server.delete("/spaces/containerObject/:spaceId/:objectId", deleteContainerObject);

    server.get("/spaces/embeddedObject/:spaceId/:objectURI", getEmbeddedObject);
    server.post("/spaces/embeddedObject/:spaceId/:objectURI", addEmbeddedObject);
    server.put("/spaces/embeddedObject/:spaceId/:objectURI", updateEmbeddedObject);
    server.delete("/spaces/embeddedObject/:spaceId/:objectURI", deleteEmbeddedObject);
    server.put("/spaces/embeddedObject/swap/:spaceId/:objectURI", swapEmbeddedObjects);

    server.get("/spaces", getSpace);
    server.get("/spaces/:spaceId", getSpace);
    server.post("/spaces", createSpace);
    server.post("/spaces/:spaceId/collaborators", addCollaboratorsToSpace);
    server.post("/spaces/:spaceId/chat/:chatId", addSpaceChatMessage);

    server.get("/spaces/:spaceId/secrets/keys", getAPIKeysMetadata);
    server.post("/spaces/secrets/keys", editAPIKey);
    server.post("/spaces/:spaceId/secrets/keys", editAPIKey);

    server.delete("/spaces/:spaceId/secrets/keys/:keyType", deleteAPIKey);
    server.delete("/spaces/:spaceId/secrets/keys/:keyType", deleteAPIKey);

    server.post("/spaces/:spaceId/announcements", addSpaceAnnouncement)
    server.get("/spaces/:spaceId/announcements/:announcementId", getSpaceAnnouncement)
    server.get("/spaces/:spaceId/announcements", getSpaceAnnouncements)
    server.put("/spaces/:spaceId/announcements/:announcementId", updateSpaceAnnouncement)
    server.delete("/spaces/:spaceId/announcements/:announcementId", deleteSpaceAnnouncement)


    server.post("/apis/v1/spaces/:spaceId/chats/:chatId/llms/text/generate", getChatTextResponse);
    server.post("/apis/v1/spaces/:spaceId/chats/:chatId/llms/text/streaming/generate", getChatTextStreamingResponse);
    server.post("/apis/v1/spaces/:spaceId/chats/:chatId/llms/image/generate", getChatImageResponse);
    server.post("/apis/v1/spaces/:spaceId/chats/:chatId/llms/image/edit", editChatImage);
    server.post("/apis/v1/spaces/:spaceId/chats/:chatId/llms/image/variants", getChatImageVariants);
    server.post("/apis/v1/spaces/:spaceId/chats/:chatId/llms/video/generate", getChatVideoResponse);

    server.post("/spaces/image/:spaceId", storeImage);
    server.delete("/spaces/image/:spaceId/:imageId", deleteImage);
    server.post("/spaces/audio/:spaceId", storeAudio);
    server.delete("/spaces/audio/:spaceId/:audioId", deleteAudio);
    server.get("/spaces/video/estimate/:spaceId/:documentId", estimateDocumentVideoLength);

    server.delete("/spaces/video/:spaceId/:videoId", deleteVideo);
    server.get("/spaces/:spaceId/export/documents/:documentId", exportDocument);
    server.get("/spaces/:spaceId/export/personalities/:personalityId", exportPersonality);
    server.post("/spaces/:spaceId/import/documents", importDocument);
    server.post("/spaces/:spaceId/import/personalities", importPersonality);
}

module.exports = SpaceStorage;
