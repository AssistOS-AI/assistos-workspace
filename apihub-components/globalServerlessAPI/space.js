const path = require('path');
const fsPromises = require('fs').promises;
const archiver = require('archiver');
const enclave = require('opendsu').loadAPI('enclave');
const crypto = require("../apihub-component-utils/crypto.js");
const date = require('../apihub-component-utils/date.js');
const openAI = require('../apihub-component-utils/openAI.js');
const secrets = require('../apihub-component-utils/secrets.js');
const fs = require('fs');
const cookie = require("../apihub-component-utils/cookie");


function getDailyLogFileName() {
    const getTaskFileName = (year, month, day) => `logs-${year}-${month}-${day}.log`;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return getTaskFileName(year, month, day);
}

async function ensureTaskFileExists(spaceId, fileName) {
    const taskFilePath = path.join(getSpacePath(spaceId), 'tasks', fileName);
    try {
        await fsPromises.access(taskFilePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fsPromises.writeFile(taskFilePath, '');
        } else {
            throw error;
        }
    }
    return taskFilePath;
}


async function getTaskLogFilePath(spaceId) {
    await ensureTasksFolderExists(spaceId);
    const logFileName = getDailyLogFileName();
    await ensureTaskFileExists(spaceId, logFileName);
    return path.join(getSpacePath(spaceId), 'tasks', getDailyLogFileName());
}

async function getSpaceChat(spaceId, chatId) {
    const lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    const tableName = `chat_${chatId}`
    let records = await $$.promisify(lightDBEnclaveClient.filter)($$.SYSTEM_IDENTIFIER, tableName);
    let chat = []
    for (let record of records) {
        chat.push({
            role: record.data.role,
            message: record.data.message,
            date: date.parseUnixDate(record.__timestamp),
            user: record.data.user
        })
    }
    return chat;
}

async function storeSpaceChat(spaceId, chatId) {
    const chat = await getSpaceChat(spaceId, chatId);
    const personality = await getPersonalityData(spaceId, chatId);
    if (!personality.chats) {
        personality.chats = {}
    }
    const id = crypto.generateId();
    personality.chats[id] = chat;
    await updatePersonalityData(spaceId, chatId, personality);
}

async function resetSpaceChat(spaceId, chatId) {
    const tableName = `chat_${chatId}`
    await lightDB.deleteAllRecords(spaceId, tableName);
}

async function addSpaceChatMessage(spaceId, chatId, entityId, role, messageData) {
    const messageId = crypto.generateId();

    const chatObj = {
        role: role,
        message: messageData,
        user: entityId,
        id: messageId
    }
    if (!chatId.includes("documents")) {
        chatId = await getPersonalityChatId(spaceId, entityId)
    }
    const documentRecord = await lightDB.getContainerObject(spaceId, chatId);

    let messagesChapterId

    let authSecret = await secrets.getApiHubAuthSecret();

    let securityContextConfig = {
        headers: {
            cookie: cookie.createApiHubAuthCookies(authSecret, this.userId, this.spaceId)
        }
    }
    const SecurityContext = require('assistos').ServerSideSecurityContext;
    const securityContext = new SecurityContext(securityContextConfig);
    const documentModule = require('assistos').loadModule('document', securityContext)

    if (documentRecord.chapters.length === 0) {
        const chatChapterData = {
            title: `Chat Messages`,
            paragraphs: []
        }
        await documentModule.addChapter(spaceId, chatId, chatChapterData);
    } else {
        messagesChapterId = documentRecord.chapters[0].id;
    }

    const paragraphObj = {
        text: composeParagraphMessage(chatObj),
        commands: {
            replay: {
                role: chatObj.role,
                name: chatObj.user,
            }
        },
        position: documentRecord.chapters[0].paragraphs.length,
        id: chatObj.id,
        comment: JSON.stringify(chatObj)
    }
    await documentModule.addParagraph(spaceId, chatId, messagesChapterId, paragraphObj);
    return messageId
}

const composeParagraphMessage = function (chatObj) {
    return chatObj.message
}

async function getPersonalityChatId(spaceId, personalityId) {
    const personalityData = await getPersonalityData(spaceId, personalityId)
    return personalityData.chats[personalityData.chats.length - 1];
}

async function updateSpaceChatMessage(spaceId, chatId, entityId, messageId, message) {
    let documentId = await getPersonalityChatId(spaceId, entityId);
    const chatDocumentRecord = await lightDB.getRecord(spaceId, documentId, messageId)
    chatDocumentRecord.data.text = message;
    await lightDB.updateRecord(spaceId, documentId, messageId, chatDocumentRecord.data)
}
async function createDefaultSpaceChats(lightDbClient, spaceId) {
    const spacePersonalities = await getSpacePersonalitiesObject(spaceId);
    for (const personality of spacePersonalities) {
        await createSpaceChat(spaceId, personality.id);
    }
    /*await Promise.all(spacePersonalities.map(personalityData => createSpaceChat(spaceId, personalityData.id)));*/
}

async function updatePersonalityData(spaceId, personalityId, personalityData) {
    const personalityPath = path.join(getSpacePath(spaceId), 'personalities', `${personalityId}.json`);
    await fsPromises.writeFile(personalityPath, JSON.stringify(personalityData, null, 2), 'utf8');
}

function getApplicationPath(spaceId, appName) {
    return path.join(getSpacePath(spaceId), 'applications', appName);
}

async function updateSpaceStatus(spaceId, spaceStatusObject) {
    const spacePath = getSpacePath(spaceId)
    const spaceStatusPath = path.join(spacePath, 'status', `status.json`);
    await fsPromises.writeFile(spaceStatusPath, JSON.stringify(spaceStatusObject, null, 2), {encoding: 'utf8'});
}

async function editAPIKey(spaceId, userId, type, APIKey) {
    let providers = require("./AIModels.json")
    let llm = providers.find((llm) => llm.provider === type);
    let apiKeyObj = {
        ownerId: userId,
        addedDate: date.getCurrentUTCDate()
    }
    for (let key of llm.authentication) {
        apiKeyObj[key] = APIKey;
    }
    await secrets.putSpaceKey(spaceId, type, apiKeyObj);
}

async function getAPIKeysMasked(spaceId) {
    let keys = JSON.parse(JSON.stringify(await secrets.getAPIKeys(spaceId)));
    for (let keyType in keys) {
        if (keys[keyType].APIKey) {
            keys[keyType].APIKey = openAI.maskKey(keys[keyType].APIKey);
        }
        if (keys[keyType].userId) {
            keys[keyType].userId = openAI.maskKey(keys[keyType].userId);
        }
    }
    return keys;
}

async function streamToJson(stream) {
    return new Promise((resolve, reject) => {
        let data = '';
        stream.on('data', chunk => data += chunk);
        stream.on('end', () => resolve(JSON.parse(data)));
        stream.on('error', err => reject(err));
    });
}

async function archivePersonality(spaceId, personalityId) {
    const personalityData = await getPersonalityData(spaceId, personalityId);
    const contentBuffer = Buffer.from(JSON.stringify(personalityData), 'utf-8');
    const checksum = require('crypto').createHash('sha256').update(contentBuffer).digest('hex');

    const metadata = {
        name: personalityData.name,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        version: "1.0",
        checksum: checksum,
        contentFile: "data.json",
    };

    const archive = archiver('zip', {zlib: {level: 9}});
    const stream = new require('stream').PassThrough();
    archive.pipe(stream);

    archive.append(contentBuffer, {name: 'data.json'});
    archive.append(Buffer.from(JSON.stringify(metadata), 'utf-8'), {name: 'metadata.json'});

    archive.finalize();
    return stream;
}

async function importPersonality(spaceId, extractedPath, request) {
    const personalityDataPath = path.join(extractedPath, 'data.json');

    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    let personalityModule = require("assistos").loadModule("agent", securityContext);
    const personalityDataStream = fs.createReadStream(personalityDataPath, 'utf8');

    const personalityData = await streamToJson(personalityDataStream);
    const spacePersonalities = await getSpacePersonalitiesObject(spaceId);
    const existingPersonality = spacePersonalities.find(personality => personality.name === personalityData.name);

    let personalityId, overriden = false, personalityName = personalityData.name;
    if (existingPersonality) {
        personalityData.id = existingPersonality.id;
        personalityId = await personalityModule.updateAgent(spaceId, existingPersonality.id, personalityData);
        overriden = true;
    } else {
        personalityId = await personalityModule.addAgent(spaceId, personalityData);
    }
    return {id: personalityId, overriden: overriden, name: personalityName};
}

async function addApplicationToSpaceObject(spaceId, applicationData, manifest) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
    spaceStatusObject.installedApplications.push({
        name: applicationData.name,
        description: manifest.description || "No description provided",
        installationDate: date.getCurrentUnixTimeSeconds(),
        lastUpdate: applicationData.lastUpdate,
    });
    await updateSpaceStatus(spaceId, spaceStatusObject);
}

async function removeApplicationFromSpaceObject(spaceId, applicationId) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
    spaceStatusObject.installedApplications = spaceStatusObject.installedApplications.filter(application => application.name !== applicationId);
    await updateSpaceStatus(spaceId, spaceStatusObject);
}


const getApplicationEntry = async function (spaceId, applicationId) {
    const applicationPath = path.join(getSpacePath(spaceId), 'applications', applicationId);
    /* assumption that each application has an index.html where it initialises itself*/
    const stubHTML = `<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>Sample Website</title> <style> body { font-family: Arial, sans-serif; margin: 20px; } .container { max-width: 800px; margin: 0 auto; } nav { background-color: #333; padding: 10px; } nav a { color: white; text-decoration: none; margin-right: 15px; } </style> </head> <body> <div class="container"> <nav> <a href="#home">Home</a> <a href="#about">About</a> <a href="#contact">Contact</a> </nav> <h1>Welcome to My Website</h1> <section id="about"> <h2>About Us</h2> <p>This is a sample paragraph about our provider. We're dedicated to providing the best service to our customers.</p> </section> <section id="contact"> <h2>Contact Form</h2> <form action="/submit" method="POST"> <label for="name">Name:</label><br> <input type="text" id="name" name="name"><br> <label for="email">Email:</label><br> <input type="email" id="email" name="email"><br> <label for="message">Message:</label><br> <textarea id="message" name="message" rows="4" cols="50"></textarea><br> <input type="submit" value="Submit"> </form> </section> <footer> <p>© 2023 My Website. All rights reserved.</p> </footer> </div> </body> </html>`;
    return stubHTML;
}

const getSpaceApplications = async function (spaceId) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
    return spaceStatusObject.installedApplications;
}

const getWebChatConfiguration = async function (spaceId) {
    const spacePath = getSpacePath(spaceId);
    const chatConfigPath = path.join(spacePath, 'webAssistantConfig.json');
    if (fs.existsSync(chatConfigPath)) {
        const chatConfig = await fsPromises.readFile(chatConfigPath, 'utf8');
        return JSON.parse(chatConfig);
    } else {
        const defaultConfig = {
            settings: {
                header: "",
                initialPrompt: "",
                chatIndications: "",
                personality: "",
                theme: "light",
                primaryColor: "#007bff",
                textColor: "#000000",
            },
            pages: []
        }
        await fsPromises.writeFile(chatConfigPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
        return defaultConfig;
    }
}

async function addWebAssistantConfigurationPage(spaceId, pageData) {
    const spacePath = getSpacePath(spaceId);
    const configPath = path.join(spacePath, 'webAssistantConfig.json');
    const config = JSON.parse(await fsPromises.readFile(configPath, 'utf8'));
    pageData.id = crypto.generateId();
    config.pages.push(pageData);
    await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    return pageData.id;
}

async function getWebAssistantConfigurationPages(spaceId) {
    const spacePath = getSpacePath(spaceId);
    const configPath = path.join(spacePath, 'webAssistantConfig.json');
    const config = JSON.parse(await fsPromises.readFile(configPath, 'utf8'));
    return config.pages;
}

async function getWebAssistantConfigurationPage(spaceId, pageId) {
    const spacePath = getSpacePath(spaceId);
    const configPath = path.join(spacePath, 'webAssistantConfig.json');
    const config = JSON.parse(await fsPromises.readFile(configPath, 'utf8'));
    const page = config.pages.find(page => page.id === pageId);
    if (!page) {
        throw new Error(`Page with id ${pageId} not found`);
    }
    return page;
}

async function updateWebAssistantConfigurationPage(spaceId, pageId, pageData) {
    const spacePath = getSpacePath(spaceId);
    const configPath = path.join(spacePath, 'webAssistantConfig.json');
    const config = JSON.parse(await fsPromises.readFile(configPath, 'utf8'));
    const pageIndex = config.pages.findIndex(page => page.id === pageId);
    if (pageIndex === -1) {
        throw new Error(`Page with id ${pageId} not found`);
    }
    config.pages[pageIndex] = {...config.pages[pageIndex], ...pageData};
    await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
}

async function deleteWebAssistantConfigurationPage(spaceId, pageId) {
    const spacePath = getSpacePath(spaceId);
    const configPath = path.join(spacePath, 'webAssistantConfig.json');
    const config = JSON.parse(await fsPromises.readFile(configPath, 'utf8'));
    const pageIndex = config.pages.findIndex(page => page.id === pageId);
    if (pageIndex === -1) {
        throw new Error(`Page with id ${pageId} not found`);
    }
    config.pages.splice(pageIndex, 1);
    await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
}

async function getWebAssistantConfigurationPageMenu(spaceId, pageId) {
    const spacePath = getSpacePath(spaceId);
    const configPath = path.join(spacePath, 'webAssistantConfig.json');
    const config = JSON.parse(await fsPromises.readFile(configPath, 'utf8'));
    const page = config.pages.find(page => page.id === pageId);
    if (!page) {
        throw new Error(`Page with id ${pageId} not found`);
    }
    return page.menu || [];
}

async function addWebAssistantConfigurationPageMenuItem(spaceId, pageId, menuItem) {
    const spacePath = getSpacePath(spaceId);
    const configPath = path.join(spacePath, 'webAssistantConfig.json');
    const config = JSON.parse(await fsPromises.readFile(configPath, 'utf8'));
    const page = config.pages.find(page => page.id === pageId);
    if (!page) {
        throw new Error(`Page with id ${pageId} not found`);
    }
    menuItem.id = crypto.generateId();
    if (!page.menu) {
        page.menu = [];
    }
    page.menu.push(menuItem);
    await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    return menuItem.id;
}

async function updateWebAssistantConfigurationPageMenuItem(spaceId, pageId, menuItemId, menuItemData) {
    const spacePath = getSpacePath(spaceId);
    const configPath = path.join(spacePath, 'webAssistantConfig.json');
    const config = JSON.parse(await fsPromises.readFile(configPath, 'utf8'));
    const page = config.pages.find(page => page.id === pageId);
    if (!page) {
        throw new Error(`Page with id ${pageId} not found`);
    }
    const menuItemIndex = page.menu.findIndex(item => item.id === menuItemId);
    if (menuItemIndex === -1) {
        throw new Error(`Menu item with id ${menuItemId} not found`);
    }
    page.menu[menuItemIndex] = {...page.menu[menuItemIndex], ...menuItemData};
    await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
}

async function deleteWebAssistantConfigurationPageMenuItem(spaceId, pageId, menuItemId) {
    const spacePath = getSpacePath(spaceId);
    const configPath = path.join(spacePath, 'webAssistantConfig.json');
    const config = JSON.parse(await fsPromises.readFile(configPath, 'utf8'));
    const page = config.pages.find(page => page.id === pageId);
    if (!page) {
        throw new Error(`Page with id ${pageId} not found`);
    }
    const menuItemIndex = page.menu.findIndex(item => item.id === menuItemId);
    if (menuItemIndex === -1) {
        throw new Error(`Menu item with id ${menuItemId} not found`);
    }
    page.menu.splice(menuItemIndex, 1);
    await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
}

async function getWebAssistantConfigurationPageMenuItem(spaceId, pageId, menuItemId) {
    const spacePath = getSpacePath(spaceId);
    const configPath = path.join(spacePath, 'webAssistantConfig.json');
    const config = JSON.parse(await fsPromises.readFile(configPath, 'utf8'));
    const page = config.pages.find(page => page.id === pageId);
    if (!page) {
        throw new Error(`Page with id ${pageId} not found`);
    }
    const menuItem = page.menu.find(item => item.id === menuItemId);
    if (!menuItem) {
        throw new Error(`Menu item with id ${menuItemId} not found`);
    }
    return menuItem;
}

async function updateWebChatConfiguration(spaceId, configuration) {
    const spacePath = getSpacePath(spaceId);
    const configPath = path.join(spacePath, 'webAssistantConfig.json');
    const config = JSON.parse(await fsPromises.readFile(configPath, 'utf8'));
    config.settings = configuration;
    await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
}

async function getWebAssistantHomePage(request, response, spaceId) {
    const pages = await getWebAssistantConfigurationPages(spaceId);
    if (pages.length === 0) {
        const error = new Error('No pages found in the web assistant configuration');
        error.statusCode = 404;
        throw error;
    }
    const webAssistantSettings = await getWebChatConfiguration(spaceId);
    const personalityId = webAssistantSettings.settings.personality;
    const personalityData = await getPersonalityData(spaceId, personalityId);
    const modelName = personalityData.llms.text;

    const relevantLlmPagesData = pages.map(page => {
        return {name: page.name, description: page.description}
    });
    const prompt = `
                **Role**
                You will be given multiple pages of a web application, and you have to decide which should be the homepage, and to return the index of that page
                
                **Pages**
                ${relevantLlmPagesData.map((page, index) => `Page Index: "${index}" Page name: "${page.name}" Page description: "${page.description}"`).join('\n')}
                
                **Output**
                - You will only respond with the integer between 0 and ${relevantLlmPagesData.length - 1} which will be the index of the page you think should be the homepage
                - Your response will strictly only include that integer to not cause automatic json parsing issue in the system
                - Your response will not contain any additional metadata, meta-commentary, or any other information
                
                **Output Response examples**
                Response 1: "0"
                Response 2: "1"
                Response 3: "2"        
    `
    const {getTextResponse} = require('../llms/controller.js');
    request.body = {}
    request.body.prompt = prompt;
    request.body.modelName = modelName;
    const llmResponse = await getTextResponse(request, response);
    const pageIndex = parseInt(llmResponse.data.message) || 0;
    return pages[pageIndex];
}

const getWidget = async function (spaceId, applicationId, widgetId) {
    let html, css, js;
    if (applicationId === "assistOS") {
        const componentPath = path.join(__dirname, `../../apihub-root/wallet/web-components/widgets/${widgetId}`);

        const jsPath = path.join(componentPath, `${widgetId}.js`);
        const cssPath = path.join(componentPath, `${widgetId}.css`);
        const htmlPath = path.join(componentPath, `${widgetId}.html`);

        html = await fsPromises.readFile(htmlPath, 'utf8');
        css = await fsPromises.readFile(cssPath, 'utf8');
        js = await fsPromises.readFile(jsPath, 'utf8');

    } else {
        const applicationPath = getApplicationPath(spaceId, applicationId);
    }

    return {
        html, css, js
    }
}

module.exports = {
        getWidget,
        getWebAssistantHomePage,
        updateWebChatConfiguration,
        getWebAssistantConfigurationPageMenuItem,
        getWebAssistantConfigurationPage,
        addWebAssistantConfigurationPage,
        getWebAssistantConfigurationPages,
        updateWebAssistantConfigurationPage,
        deleteWebAssistantConfigurationPage,
        getWebAssistantConfigurationPageMenu,
        addWebAssistantConfigurationPageMenuItem,
        updateWebAssistantConfigurationPageMenuItem,
        deleteWebAssistantConfigurationPageMenuItem,
        getSpaceApplications,
        getApplicationEntry,
        getWebChatConfiguration,
        addApplicationToSpaceObject,
        removeApplicationFromSpaceObject,
        updateSpaceStatus,
        getSpaceChat,
        addSpaceChatMessage,
        editAPIKey,
        getAPIKeysMasked,
        archivePersonality,
        importPersonality,
        streamToJson,
        getTaskLogFilePath,
        updateSpaceChatMessage,
        resetSpaceChat,
        storeSpaceChat,
}

