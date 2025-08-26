import UI from "../WebSkel/webSkel.js";

const UIConfigsPath = './chat-configs.json'
window.UI = await UI.initialise(UIConfigsPath);

const parseCookies = function (cookieString) {
    return cookieString
        .split('; ')
        .reduce((acc, cookie) => {
            const [key, value] = cookie.split('=');
            acc[key] = decodeURIComponent(value);
            return acc;
        }, {});
}

const userModule = AssistOS.loadModule("user", {});
let webAssistantModule = AssistOS.loadModule("webassistant", {});
let agentModule = AssistOS.loadModule("agent", {});
const cacheNames = await caches.keys();
await Promise.all(cacheNames.map(name => caches.delete(name)));

async function checkAuthentication(email) {
    assistOS.user = await userModule.loadUser(email);
    assistOS.globalRoles = await userModule.getGlobalRoles();
    assistOS.securityContext = {
        userId: assistOS.user.id,
        email: assistOS.user.email
    }
}

const launchAssistant = async (chatId) => {
    let { userId } = assistOS.securityContext;
    return window.UI.createElement(
        'iframe-chat-page',
        appContainer,
        { chatId, spaceId, userId, widgetId },
        true
    );
}


window.assistOS = {
    iframe: true,
    UI: window.UI,
    loadModule: function (moduleName) {
        return AssistOS.loadModule(moduleName, assistOS.securityContext);
    }
};
const urlParams = new URLSearchParams(window.location.search);
const spaceId = urlParams.get("space");
assistOS.agent = await agentModule.getDefaultAgent(spaceId);
window.spaceId = spaceId;

assistOS.securityContext = {};


const widgetId = urlParams.get("widget") || null;
const appContainer = document.getElementById('app-container');
let { chatId } = parseCookies(document.cookie);
const authType = await webAssistantModule.getAuth(spaceId)

let isAuthenticated = false;
try {
    const { email } = parseCookies(document.cookie);
    await checkAuthentication(email);
    isAuthenticated = true;
} catch (error) {
    isAuthenticated = false;
}

async function handlePublicAuth() {
    let { userId } = parseCookies(document.cookie)

    if (!userId) {
        //await createGuestUser();
    }
}

async function handleExistingSpaceMembersAuth() {
    if (!isAuthenticated) {
        let resAuth;
        const authenticatedPromise = new Promise((resolve, reject) => {
            resAuth = resolve;
        })
        window.UI.createElement(
            'login-page',
            appContainer,
            { spaceId, resAuth },
            {
                "data-spaceId": spaceId
            },
            true
        );
        await authenticatedPromise;
    }
}

async function handleNewAndExistingSpaceMembersAuth() {
    if (!isAuthenticated) {
        let resAuth;
        const authenticatedPromise = new Promise((resolve, reject) => {
            resAuth = resolve;
        })
        window.UI.createElement(
            'login-page',
            appContainer,
            { spaceId, resAuth, register: true },
            {
                "data-spaceId": spaceId
            },
            true
        );
        await authenticatedPromise;
    }
}

switch (authType) {
    case "public":
        await handlePublicAuth();
        break;
    case "existingSpaceMembers":
        await handleExistingSpaceMembersAuth();
        break;
    case "newAndExistingSpaceMembers":
        await handleNewAndExistingSpaceMembersAuth();
        break;
}

let chatModule = AssistOS.loadModule("chat", assistOS.securityContext);
if (!chatId) {
    const userChats = await chatModule.getUserChats(spaceId, assistOS.securityContext.email);
    if (!userChats || !userChats.length) {
        chatId = await chatModule.createDefaultChat(spaceId, assistOS.securityContext.email);
    } else {
        chatId = userChats[0];
    }
}
document.cookie = `chatId=${chatId}; path=/; max-age=31536000`;

await launchAssistant(chatId);









