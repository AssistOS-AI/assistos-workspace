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
    getWidget,
    headFile,
    getFile,
    putFile,
    deleteFile,
    deleteSpace,
    restartServerless,
    installSystemApps,
    loadApplicationFile
} = require("./controller");
const contextMiddleware = require('../apihub-component-middlewares/context.js')
const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const constants = require("assistos").constants;
const path = require("path");
const process = require("process");
const secrets = require("../apihub-component-utils/secrets");
const cookies = require("../apihub-component-utils/cookie.js");
function Space(server) {
    setTimeout(async ()=> {
        await installSystemApps();
        let adminClient = await require("opendsu").loadAPI("serverless").createServerlessAPIClient("*", process.env.BASE_URL, process.env.SERVERLESS_ID, constants.ASSISTOS_ADMIN_PLUGIN, "",{authToken: process.env.SERVERLESS_AUTH_SECRET});
        let spaces = await adminClient.listAllSpaces(process.env.SERVERLESS_AUTH_SECRET);
        for(let spaceId of spaces){
            let serverlessFolder = path.join(server.rootFolder, "external-volume", "spaces", spaceId);
            let apiKeys = await secrets.getAPIKeys(spaceId);
            server.createServerlessAPI({
                urlPrefix: spaceId,
                storage: serverlessFolder,
                env: {
                    SERVERLESS_ROOT_FOLDER: serverlessFolder,
                    PERSISTENCE_FOLDER: path.join(serverlessFolder, "persistence"),
                    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
                    SENDGRID_SENDER_EMAIL: process.env.SENDGRID_SENDER_EMAIL,
                    ...apiKeys,
                    INTERNAL_WEBHOOK_URL: `${process.env.BASE_URL}/internalWebhook`
                }
            }).then((serverlessAPI) => {
                server.registerServerlessProcess(spaceId, serverlessAPI);
            });
        }
        let founderSpaceExists = await adminClient.founderSpaceExists();
        if(!founderSpaceExists){
            let globalAdminClient = await require("opendsu").loadAPI("serverless").createServerlessAPIClient("*", process.env.BASE_URL, process.env.SERVERLESS_ID, constants.ADMIN_PLUGIN, "",{authToken: process.env.SERVERLESS_AUTH_SECRET});
            let founderEmail = process.env.SYSADMIN_EMAIL;
            if(!founderEmail){
                console.error("SYSADMIN_EMAIL environment variable is not set");
            }
             let founderId = await globalAdminClient.getFounderId();
            let spaceModule = require("assistos").loadModule("space", {
                cookies: cookies.createAdminCookies(founderEmail, founderId, process.env.SERVERLESS_AUTH_SECRET)
            });
            if (process.env.SYSADMIN_SPACE) {
                console.warn(`SYSADMIN_SPACE environment variable is not set, using default "Admin Space`);
                process.env.SYSADMIN_SPACE = "Admin Space";
            }
            await spaceModule.createSpace(process.env.SYSADMIN_SPACE, founderEmail);
        }
    }, 0);

    const PrometheusClient = require('prom-client');

    const register = new PrometheusClient.Registry();

    const totalRequestsCounter = new PrometheusClient.Counter({
        name: 'total_requests_count',
        help: 'Total number of HTTP requests',
        registers: [register]
    });

    server.use("*",(req, res, next) => {
        totalRequestsCounter.inc();
        next();
    });

    server.get("/metrics", async (req, res) => {
        const expectedToken = process.env.METRICS_AUTH_TOKEN;
        const receivedToken = req.headers.authorization?.replace('Bearer ', '');

        if (expectedToken && receivedToken !== expectedToken) {
            res.writeHead(401, {'Content-Type': 'text/plain'});
            res.end('Unauthorized');
            return;
        }

        try {
            const metrics = await register.metrics();
            res.writeHead(200, {
                'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
            });
            res.end(metrics);
        } catch (error) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Internal Server Error');
        }
    });

    server.use("/spaces/*", contextMiddleware);
    server.head("/spaces/files/:fileId", headFile);
    server.get("/spaces/files/:fileId", getFile);


    server.use("/spaces/*", bodyReader);
    server.use("/public/*", bodyReader);

    server.get("/public/spaces/widgets/:spaceId/:applicationId/:widgetName", getWidget);

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
    server.delete("/spaces/:spaceId", async (req, res)=>{
        await deleteSpace(req, res, server);
    });

    /*API Keys*/
    server.get("/spaces/:spaceId/secrets", getSecretsMasked);
    server.post("/spaces/:spaceId/secrets", addSecret);
    server.put("/spaces/:spaceId/secrets", editSecret);
    server.put("/spaces/:spaceId/secrets/delete", deleteSecret);

    server.put("/spaces/:spaceId/restart", restartServerless);

    /*applications */
    server.get("/applications/files/:spaceId/:appName/*", async (req, res)=>{
        await loadApplicationFile(req, res, server);
    });
}

module.exports = Space;
