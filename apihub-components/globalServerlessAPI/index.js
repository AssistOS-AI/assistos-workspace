const {
    getSpaceStatus,
    createSpace,
    listUserSpaces,
    getSecretsMasked,
    addSecret,
    editSecret,
    deleteSecret,
    getUploadURL,
    getDownloadURL,
    headFile,
    getFile,
    putFile,
    deleteFile,
    deleteSpace,
} = require("./controller");
const contextMiddleware = require('../apihub-component-middlewares/context.js')
const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const constants = require("assistos").constants;
const path = require("path");
const process = require("process");
const secrets = require("../apihub-component-utils/secrets");
function Space(server) {
    setTimeout(async ()=> {
        let client = await require("opendsu").loadAPI("serverless").createServerlessAPIClient("*", process.env.BASE_URL, process.env.SERVERLESS_ID, constants.WORKSPACE_PLUGIN, "",{authToken: process.env.SSO_SECRETS_ENCRYPTION_KEY});
        let spaces = await client.listAllSpaces();
        for(let spaceId of spaces){
            let serverlessFolder = path.join(server.rootFolder, "external-volume", "spaces", spaceId);
            let apiKeys = await secrets.getAPIKeys(spaceId);
            server.createServerlessAPI({
                urlPrefix: spaceId,
                storage: serverlessFolder,
                env: {
                    PERSISTENCE_FOLDER: path.join(serverlessFolder, "persistence"),
                    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
                    SENDGRID_SENDER_EMAIL: process.env.SENDGRID_SENDER_EMAIL,
                    API_KEYS: JSON.stringify(apiKeys),
                }
            }).then((serverlessAPI) => {
                let serverUrl = serverlessAPI.getUrl();
                server.registerServerlessProcessUrl(spaceId, serverUrl);
            });
        }
    },0);

    server.use("/spaces/*", contextMiddleware);
    server.head("/spaces/files/:fileId", headFile);
    server.get("/spaces/files/:fileId", getFile);


    server.use("/spaces/*", bodyReader);
    server.use("/public/*", bodyReader);
    server.use("/apis/v1/spaces/*", bodyReader);

    server.get("/spaces/listSpaces", listUserSpaces);

    /*Attachments*/
    server.get("/spaces/uploads", getUploadURL);
    server.get("/spaces/downloads/:fileId", getDownloadURL);
    server.put("/spaces/files/:fileId", putFile);
    server.delete("/spaces/files/:fileId", deleteFile);

    /*spaces*/
    server.get("/spaces", getSpaceStatus);
    server.get("/spaces/:spaceId", getSpaceStatus);
    server.post("/spaces", async (req, res)=>{
        await createSpace(req, res, server);
    });
    server.delete("/spaces/:spaceId", deleteSpace);

    /*API Keys*/
    server.get("/spaces/:spaceId/secrets", getSecretsMasked);
    server.post("/spaces/:spaceId/secrets", addSecret);
    server.put("/spaces/:spaceId/secrets", editSecret);
    server.put("/spaces/:spaceId/secrets/delete", deleteSecret);
}

module.exports = Space;
