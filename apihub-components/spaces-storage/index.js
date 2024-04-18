const {
    getFileObject,
    addFileObject,
    updateFileObject,
    deleteFileObject,
    getContainerObject,
    addContainerObject,
    updateContainerObject,
    deleteContainerObject,
    getEmbeddedObject,
    addEmbeddedObject,
    updateEmbeddedObject,
    deleteEmbeddedObject,
    getSpace,
    createSpace,
    addCollaboratorToSpace
} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')

function SpaceStorage(server) {
    server.use("/spaces/*", bodyReader);
    server.use("/spaces/*", authentication);

    server.get("/spaces", getSpace);
    server.get("/spaces/:spaceId", getSpace);

    server.post("/spaces", createSpace);
    server.delete("/spaces/:spaceId", deleteSpace);

    server.post("/spaces/collaborators", addCollaboratorToSpace);

    server.get("/spaces/fileObject/:spaceId/:objectType/:objectId", getFileObject);
    server.post("/spaces/fileObject/:spaceId/:objectType", addFileObject);
    server.put("/spaces/fileObject/:spaceId/:objectType/:objectId", updateFileObject);
    server.delete("/spaces/fileObject/:spaceId/:objectType/:objectId", deleteFileObject);

    server.get("/spaces/containerObject/:spaceId/:objectType/:objectId", getContainerObject);
    server.post("/spaces/containerObject/:spaceId/:objectType", addContainerObject);
    server.put("/spaces/containerObject/:spaceId/:objectType/:objectId", updateContainerObject);
    server.delete("/spaces/containerObject/:spaceId/:objectType/:objectId", deleteContainerObject);

    server.get("/spaces/embeddedObject/:spaceId/:objectType/:objectURI", getEmbeddedObject);
    server.post("/spaces/embeddedObject/:spaceId/:objectType/:objectURI", addEmbeddedObject);
    server.put("/spaces/embeddedObject/:spaceId/:objectType/:objectURI", updateEmbeddedObject);
    server.delete("/spaces/embeddedObject/:spaceId/:objectType/:objectURI", deleteEmbeddedObject);

    server.post("/spaces/:spaceId/secrets", storeSecret);
    server.get("/spaces", getSpace);
    server.get("/spaces/:spaceId", getSpace);
    server.post("/spaces", createSpace);
    server.post("/spaces/collaborators", addCollaboratorToSpace);
    server.put("/spaces/:spaceId", storeSpace);
}

module.exports = SpaceStorage;