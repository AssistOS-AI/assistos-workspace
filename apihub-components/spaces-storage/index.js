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
    getSpaceCollaborators,
    setSpaceCollaboratorRole,
    deleteSpaceCollaborator,
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
    exportPersonality,
    importPersonality,
    getSpaceChat,
    getFileObjects,
    getUploadURL,
    getDownloadURL,
    headFile,
    getFile,
    putFile,
    deleteFile,
    deleteSpace,
    resetSpaceChat,
    saveSpaceChat,
    chatCompleteParagraph
} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')

function SpaceStorage(server) {
    server.head("/spaces/files/:fileId", headFile);
    server.get("/spaces/files/:fileId", getFile);

    server.use("/spaces/*", bodyReader);
    server.use("/apis/v1/spaces/*", bodyReader);

    server.use("/apis/v1/spaces/*", authentication);
    server.use("/spaces/*", authentication);

    /*Attachments*/
    server.get("/spaces/uploads", getUploadURL);
    server.get("/spaces/downloads/:fileId", getDownloadURL);
    server.put("/spaces/files/:fileId", putFile);
    server.delete("/spaces/files/:fileId", deleteFile);

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
    server.get("/spaces/collaborators/:spaceId", getSpaceCollaborators);
    server.post("/spaces/collaborators/:spaceId", addCollaboratorsToSpace);
    server.put("/spaces/collaborators/:spaceId/:collaboratorId", setSpaceCollaboratorRole);
    server.delete("/spaces/collaborators/:spaceId/:collaboratorId", deleteSpaceCollaborator);

    server.post("/spaces/chat/:spaceId/:chatId", addSpaceChatMessage);
    server.get("/spaces/chat/:spaceId/:chatId", getSpaceChat);
    server.delete("/spaces/chat/:spaceId/:chatId", resetSpaceChat);
    server.post("/spaces/chat/save/:spaceId/:chatId", saveSpaceChat);

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

    /*Personalities*/
    server.get("/spaces/:spaceId/export/personalities/:personalityId", exportPersonality);
    server.post("/spaces/:spaceId/import/personalities", importPersonality);

    server.post("/spaces/chat-completion/:spaceId/:documentId/:paragraphId",chatCompleteParagraph)
}

module.exports = SpaceStorage;
