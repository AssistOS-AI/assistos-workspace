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
    getAPIKeysMetadata
} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')
const {getAPIKeys} = require("../apihub-component-utils/secrets");
const {getImageResponse, editImage, getImageVariants, getVideoResponse, getTextResponse, getTextStreamingResponse} = require("../llms/controller");

function SpaceStorage(server) {
    server.use("/spaces/*", bodyReader);

    /* invitations */
    server.get("/spaces/invitations/reject", rejectSpaceInvitation);
    server.get("/spaces/invitations/accept", acceptSpaceInvitation);

    server.use("/spaces/*", authentication);

    server.get("/spaces", getSpace);
    server.get("/spaces/:spaceId", getSpace);

    server.post("/spaces", createSpace);

    server.get("/spaces/fileObject/:spaceId/:objectType", getFileObjectsMetadata);
    server.get("/spaces/fileObject/:spaceId/:objectType/:objectId", getFileObject);
    server.post("/spaces/fileObject/:spaceId/:objectType", addFileObject);
    server.put("/spaces/fileObject/:spaceId/:objectType/:objectId", updateFileObject);
    server.delete("/spaces/fileObject/:spaceId/:objectType/:objectId", deleteFileObject);

    server.get("/spaces/:spaceId/agents",getAgent)
    server.get("/spaces/:spaceId/agents/:agentId",getAgent)

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
    server.post("/spaces/:spaceId/chat", addSpaceChatMessage);

    server.get("/spaces/:spaceId/secrets/keys",getAPIKeysMetadata);
    server.post("/spaces/secrets/keys", editAPIKey);
    server.post("/spaces/:spaceId/secrets/keys",editAPIKey);

    server.delete("/spaces/secrets/keys/:keyType",deleteAPIKey);
    server.delete("/spaces/:spaceId/secrets/keys/:keyType",deleteAPIKey);


    server.post("spaces/:spaceId/chat/:chatId/llms/text/generate", getTextResponse);
    server.post("spaces/:spaceId/chat/:chatId/llms/text/streaming/generate", getTextStreamingResponse);

    server.post("spaces/:spaceId/chat/:chatId/llms/image/generate", getImageResponse);
    server.post("spaces/:spaceId/chat/:chatId/llms/image/edit", editImage);
    server.post("spaces/:spaceId/chat/:chatId/llms/image/variants", getImageVariants);
    server.post("spaces/:spaceId/chat/:chatId/llms/video/generate", getVideoResponse);
}

module.exports = SpaceStorage;