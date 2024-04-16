const {getObject, addObject, updateObject, deleteObject, storeSecret, getSpace, createSpace, addCollaboratorToSpace,
    storeSpace, storeObject
} = require("./controller");
const bodyReader = require("../apihub-component-middlewares/bodyReader");

function SpaceStorage(server) {
    const {
        loadObject,
        storeObject,
        getObject,
        addObject,
        updateObject,
        deleteObject,
        getSpace,
        storeSpace,
        createSpace,
        storeSecret,
        addCollaboratorToSpace
    } = require("./controller");

    const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
    const authentication = require('../apihub-component-middlewares/authentication.js')

    server.use("/spaces/*", authentication);
    server.get("/spaces/:spaceId/:objectType/:objectName", getObject);
    server.get("/spaces/:spaceId/objects/:objectType/:objectName", loadObject);

    server.use("/spaces/*", bodyReader);

    server.put("/spaces/:spaceId/objects/:objectType/:objectName", storeObject);

    server.post("/spaces/:spaceId/:objectType", addObject);
    server.put("/spaces/:spaceId/:objectType/:objectName", updateObject);
    server.delete("/spaces/:spaceId/:objectType/:objectName", deleteObject);

    server.post("/spaces/:spaceId/secrets", storeSecret);
    server.get("/spaces", getSpace);
    server.get("/spaces/:spaceId", getSpace);
    server.post("/spaces", createSpace);
    server.post("/spaces/collaborators", addCollaboratorToSpace);
    server.put("/spaces/:spaceId", storeSpace);
}

module.exports = SpaceStorage;