const {storeObject, storeSecret, loadObject} = require("./controller");
const {loadAppFlows} = require("../flows-storage/controller");

function SpaceStorage(server) {
    const bodyReaderMiddleware = require('../requests-processing-apis/exporter.js')
    ('bodyReaderMiddleware');

    const {
        loadObject,
        storeObject,
        getSpace,
        storeSpace,
        createSpace,
        storeSecret,
        addCollaboratorToSpace
    } = require("./controller");

    /* server.use("/spaces/*",authenticationMiddleware)  */
    /* server.use("/spaces/*",authorizationMiddleware)  */

    server.get("/spaces/:spaceId/:objectType/:objectName", async (request, response) => {
        await loadObject(request, response)
    });

    server.delete("/spaces/:spaceId/:objectType/:objectName", async (request, response) => {
        await storeObject(request, response)
    });

    server.put("/spaces/:spaceId/:objectType/:objectName", async (request, response) => {
        await storeObject(request, response)
    });

    server.post("/spaces/:spaceId/secrets", async (request, response) => {
        await storeSecret(request, response, server)
    });
    server.use("/spaces/*", bodyReaderMiddleware);

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