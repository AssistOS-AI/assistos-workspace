const {
    getSpaceStatus,
    createSpace,
    listUserSpaces,
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
    exportPersonality,
    importPersonality,
    getSpaceChat,
    getUploadURL,
    getDownloadURL,
    headFile,
    getFile,
    putFile,
    deleteFile,
    deleteSpace,
    resetSpaceChat,
    saveSpaceChat,
    chatCompleteParagraph,
    getApplicationEntry,
    getWebChatConfiguration,
    addWebAssistantConfigurationPage,
    getWebAssistantConfigurationPages,
    updateWebAssistantConfigurationPage,
    deleteWebAssistantConfigurationPage,
    getWebAssistantConfigurationPageMenu,
    addWebAssistantConfigurationPageMenuItem,
    updateWebAssistantConfigurationPageMenuItem,
    deleteWebAssistantConfigurationPageMenuItem,
    getWebAssistantConfigurationPage,
    getWebAssistantConfigurationPageMenuItem,
    updateWebChatConfiguration,
    getWebAssistantHomePage,
    getWidget
} = require("./controller");
const contextMiddleware = require('../apihub-component-middlewares/context.js')
const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const constants = require("assistos").constants;
const path = require("path");
const process = require("process");
function Space(server) {
    setTimeout(async ()=> {
        let client = await require("opendsu").loadAPI("serverless").createServerlessAPIClient("*", process.env.BASE_URL, process.env.SERVERLESS_ID, constants.SPACE_PLUGIN, "",{authToken: process.env.SSO_SECRETS_ENCRYPTION_KEY});
        let spaces = await client.listAllSpaces();
        for(let spaceId of spaces){
            let serverlessFolder = path.join(server.rootFolder, "external-volume", "spaces", spaceId);
            server.createServerlessAPI({
                urlPrefix: spaceId,
                storage: serverlessFolder,
                env: {
                    PERSISTENCE_FOLDER: path.join(serverlessFolder, "persistence"),
                    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
                    SENDGRID_SENDER_EMAIL: process.env.SENDGRID_SENDER_EMAIL,
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
    
    /*Personalities*/
    server.get("/spaces/:spaceId/export/personalities/:personalityId", exportPersonality);
    server.post("/spaces/:spaceId/import/personalities", importPersonality);
    server.post("/spaces/chat-completion/:spaceId/:documentId/:paragraphId", chatCompleteParagraph)
    server.get("/api/v1/spaces/:spaceId/applications/:applicationId", getApplicationEntry);
    server.get("/spaces/:spaceId/web-assistant/configuration", getWebChatConfiguration);
    server.put("/spaces/:spaceId/web-assistant/configuration/settings", updateWebChatConfiguration);
    server.post("/spaces/:spaceId/web-assistant/configuration/pages", addWebAssistantConfigurationPage);
    server.get("/spaces/:spaceId/web-assistant/configuration/pages", getWebAssistantConfigurationPages);
    server.get("/spaces/:spaceId/web-assistant/configuration/pages/:pageId", getWebAssistantConfigurationPage)
    server.put("/spaces/:spaceId/web-assistant/configuration/pages/:pageId", updateWebAssistantConfigurationPage);
    server.delete("/spaces/:spaceId/web-assistant/configuration/pages/:pageId", deleteWebAssistantConfigurationPage);
    server.get("/spaces/:spaceId/web-assistant/home-page", getWebAssistantHomePage);
    server.get("/spaces/:spaceId/web-assistant/configuration/pages/:pageId/menu/:menuItemId", getWebAssistantConfigurationPageMenuItem);
    server.get("/spaces/:spaceId/web-assistant/configuration/pages/:pageId/menu", getWebAssistantConfigurationPageMenu);
    server.post("/spaces/:spaceId/web-assistant/configuration/pages/:pageId/menu", addWebAssistantConfigurationPageMenuItem);
    server.put("/spaces/:spaceId/web-assistant/configuration/pages/:pageId/menu/:menuItemId", updateWebAssistantConfigurationPageMenuItem);
    server.delete("/spaces/:spaceId/web-assistant/configuration/pages/:pageId/menu/:menuItemId", deleteWebAssistantConfigurationPageMenuItem);

    server.get("/public/spaces/widgets/:spaceId/:applicationId/:widgetName", getWidget);
}

module.exports = Space;
