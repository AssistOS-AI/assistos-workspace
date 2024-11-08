const {
    insertContainerObject,
    insertEmbeddedObject,
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
    putImage,
    getImage,
    deleteImage,
    putAudio,
    deleteAudio,
    getAudio,
    deleteVideo,
    headAudio,
    headImage,
    headVideo,
    exportPersonality,
    importPersonality,
    getVideo,
    getSpaceChat,
    getFileObjects,
    putVideo,
    getUploadURL,
    getDownloadURL,
    deleteSpace
} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')

function SpaceStorage(server) {
    server.head("/spaces/audios/:audioId", headAudio);
    server.head("/spaces/images/:imageId", headImage);
    server.head("/spaces/videos/:videoId", headVideo);

    server.get("/spaces/audios/:audioId", getAudio);
    server.get("/spaces/images/:imageId", getImage);
    server.get("/spaces/videos/:videoId", getVideo);

    server.use("/spaces/*", bodyReader);
    server.use("/apis/v1/spaces/*", bodyReader);

    server.use("/apis/v1/spaces/*", authentication);
    server.use("/spaces/*", authentication);
    /*spaces*/
    server.get("/spaces", getSpace);
    server.get("/spaces/:spaceId", getSpace);
    server.post("/spaces", createSpace);
    server.delete("/spaces/:spaceId", deleteSpace);
    /*agent*/
    server.get("/spaces/:spaceId/agents", getAgent);
    server.get("/spaces/:spaceId/agents/:agentId", getAgent);

    /*fileObjects*/
    /* TODO route to actually get all files of an objectType , or to pass some filtering function   */
    server.get("/spaces/fileObject/:spaceId/:objectType/data", getFileObjects);
    server.get("/spaces/fileObject/:spaceId/:objectType", getFileObjectsMetadata);
    server.get("/spaces/fileObject/:spaceId/:objectType/:objectId", getFileObject);
    server.post("/spaces/fileObject/:spaceId/:objectType", addFileObject);
    server.put("/spaces/fileObject/:spaceId/:objectType/:objectId", updateFileObject);
    server.delete("/spaces/fileObject/:spaceId/:objectType/:objectId", deleteFileObject);

    /*containerObjects*/
    server.get("/spaces/containerObject/meta/:spaceId/:objectType", getContainerObjectsMetadata);
    server.get("/spaces/containerObject/:spaceId/:objectId", getContainerObject);
    server.post("/spaces/containerObject/:spaceId/:objectType", addContainerObject);
    server.put("/spaces/containerObject/:spaceId/:objectId", updateContainerObject);
    server.delete("/spaces/containerObject/:spaceId/:objectId", deleteContainerObject);

    /*embeddedObjects*/
    server.get("/spaces/embeddedObject/:spaceId/:objectURI", getEmbeddedObject);
    server.post("/spaces/embeddedObject/:spaceId/:objectURI", addEmbeddedObject);
    server.put("/spaces/embeddedObject/:spaceId/:objectURI", updateEmbeddedObject);
    server.delete("/spaces/embeddedObject/:spaceId/:objectURI", deleteEmbeddedObject);
    server.put("/spaces/embeddedObject/swap/:spaceId/:objectURI", swapEmbeddedObjects);

    /*Collaborators*/
    server.post("/spaces/:spaceId/collaborators", addCollaboratorsToSpace);
    server.post("/spaces/:spaceId/chat", addSpaceChatMessage);
    server.get("/spaces/:spaceId/chat", getSpaceChat);

    /*API Keys*/
    server.get("/spaces/:spaceId/secrets/keys", getAPIKeysMetadata);
    server.post("/spaces/secrets/keys", editAPIKey);
    server.post("/spaces/:spaceId/secrets/keys", editAPIKey);
    server.delete("/spaces/:spaceId/secrets/keys/:keyType", deleteAPIKey);
    server.delete("/spaces/:spaceId/secrets/keys/:keyType", deleteAPIKey);

    /*Announcements*/
    server.post("/spaces/:spaceId/announcements", addSpaceAnnouncement)
    server.get("/spaces/:spaceId/announcements/:announcementId", getSpaceAnnouncement)
    server.get("/spaces/:spaceId/announcements", getSpaceAnnouncements)
    server.put("/spaces/:spaceId/announcements/:announcementId", updateSpaceAnnouncement)
    server.delete("/spaces/:spaceId/announcements/:announcementId", deleteSpaceAnnouncement);

    /*Chat*/
    server.post("/apis/v1/spaces/:spaceId/chats/:chatId/llms/text/generate", getChatTextResponse);
    server.post("/apis/v1/spaces/:spaceId/chats/:chatId/llms/text/streaming/generate", getChatTextStreamingResponse);

    /*Attachments*/
    server.get("/spaces/uploads/:type", getUploadURL);
    server.get("/spaces/downloads/:type/:fileId", getDownloadURL);
    server.put("/spaces/images/:imageId", putImage);
    server.put("/spaces/audios/:audioId", putAudio);
    server.put("/spaces/videos/:videoId", putVideo);
    server.delete("/spaces/images/:imageId", deleteImage);
    server.delete("/spaces/audios/:audioId", deleteAudio);
    server.delete("/spaces/videos/:videoId", deleteVideo);

    /*Personalities*/
    server.get("/spaces/:spaceId/export/personalities/:personalityId", exportPersonality);
    server.post("/spaces/:spaceId/import/personalities", importPersonality);
}

module.exports = SpaceStorage;
