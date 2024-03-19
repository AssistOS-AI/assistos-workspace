function SpaceStorage(server) {
    const bodyReaderMiddleware = require('../requests-processing-apis/exporter.js')
    ('bodyReaderMiddleware');

    const {loadObject, storeObject, loadSpace, storeSpace, createSpace, storeSecret,addCollaboratorToSpace} = require("./controller.js");

    server.get("/spaces/:spaceId/:objectType/:objectName", async (request, response) => {
        await loadObject(request, response)
    });
    server.get("/load-space/:spaceId", async (request, response) => {
        await loadSpace(request, response)
    });

    server.delete("/spaces/:spaceId/:objectType/:objectName", async (request, response) => {
        await storeObject(request, response)
    });

    server.post("/spaces/:spaceId/secrets", async (request, response) => {
        await storeSecret(request, response, server)
    });

    server.use("/spaces/*", bodyReaderMiddleware);

    server.post("/spaces/:spaceName", async (request, response) => {
        await createSpace(request, response)
    });
    server.post("/spaces/collaborators/", async (request, response) => {
        await addCollaboratorToSpace(request, response)
    });
    server.put("/spaces/:spaceId/:objectType/:objectName", async (request, response) => {
        await storeObject(request, response)
    });

    server.put("/spaces/:spaceId", async (request, response) => {
        await storeSpace(request, response, server)
    });
}

module.exports = SpaceStorage;