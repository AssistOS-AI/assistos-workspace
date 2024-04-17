const {
    loadObject,
    getObject,
    addObject,
    updateObject,
    deleteObject,
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

    server.get("/spaces/:spaceId/:objectType/:objectName", getObject);
    server.get("/spaces/:spaceId/objects/:objectType/:objectName", loadObject);

    server.post("/spaces/:spaceId/:objectType", addObject);
    server.put("/spaces/:spaceId/:objectType/:objectName", updateObject);
    server.delete("/spaces/:spaceId/:objectType/:objectName", deleteObject);

}

module.exports = SpaceStorage;