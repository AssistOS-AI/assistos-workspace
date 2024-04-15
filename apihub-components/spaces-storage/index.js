function SpaceStorage(server) {
    const {
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


    server.use("/spaces/*", bodyReader);
    server.use("/spaces/*", authentication);
    server.get("/spaces/:spaceId/:objectType/:objectName", async (request, response) => {
        await getObject(request, response)
    });

    server.post("/spaces/:spaceId/:objectType", async (request, response) => {
        await addObject(request, response);
    });

    server.put("/spaces/:spaceId/:objectType/:objectName", async (request, response) => {
        await updateObject(request, response);
    });

    server.delete("/spaces/:spaceId/:objectType/:objectName", async (request, response) => {
        await deleteObject(request, response);
    });

    server.post("/spaces/:spaceId/secrets", async (request, response) => {
        await storeSecret(request, response, server)
    });
    server.get("/spaces", async (request, response) => {
        await getSpace(request, response)
    });

    server.get("/spaces/:spaceId", async (request, response) => {
        await getSpace(request, response)
    });

    server.post("/spaces", async (request, response) => {
        await createSpace(request, response)
    });
    server.post("/spaces/collaborators", async (request, response) => {
        await addCollaboratorToSpace(request, response)
    });

    server.put("/spaces/:spaceId", async (request, response) => {
        await storeSpace(request, response, server)
    });
}

module.exports = SpaceStorage;