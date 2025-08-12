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

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./serviceWorker.js')
        .then(reg => {
            reg.active.addEventListener('statechange', e => {
                if (e.target.state === 'activated') {
                    window.location.reload();
                }
            });
        });
}



const userModule = require("assistos").loadModule("user", {});
let webAssistantModule = require("assistos").loadModule("webassistant", {});
let agentModule = require("assistos").loadModule("agent", {});
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
    let {userId} = assistOS.securityContext;
    return window.UI.createElement(
        'iframe-chat-page',
        appContainer,
        {chatId, spaceId, userId, pageId},
        true
    );
}


window.assistOS = {
    iframe: true,
    UI: window.UI,
    loadModule: function (moduleName) {
        return require("assistos").loadModule(moduleName, assistOS.securityContext);
    }
};
const urlParams = new URLSearchParams(window.location.search);
const spaceId = urlParams.get("space");
assistOS.agent = await agentModule.getDefaultAgent(spaceId);
window.spaceId = spaceId;

assistOS.UI.loadWidget = async function (spaceId, applicationId, widgetName) {
    const webComponentsRootDir = './../../wallet/web-components/chat';
    const r = await fetch(`/public/spaces/widgets/${spaceId}/${applicationId}/${widgetName}`)
    const data = (await r.json()).data
    const cache = await caches.open("virtual-widgets")
    await cache.put(`${webComponentsRootDir}/virtual/widgets/${widgetName}/${widgetName}.html`,
        new Response(data.html, {headers: {"Content-Type": "text/html"}}));
    await cache.put(`${webComponentsRootDir}/virtual/widgets/${widgetName}/${widgetName}.css`,
        new Response(data.css, {headers: {"Content-Type": "text/css"}}));
    await cache.put(`${webComponentsRootDir}/virtual/widgets/${widgetName}/${widgetName}.js`,
        new Response(data.js, {headers: {"Content-Type": "application/javascript"}}));

    const component = {
        name: widgetName,
        type: 'widgets',
        directory: 'virtual',
        presenterClassName: data.presenterClassName,
    }

    await assistOS.UI.defineComponent(component);

    return component;
}
assistOS.securityContext = {};


const pageId = urlParams.get("page") || null;
const appContainer = document.getElementById('app-container');
let {chatId} = parseCookies(document.cookie);
const authType = await webAssistantModule.getAuth(spaceId)

let isAuthenticated = false;
try {
    const {email} = parseCookies(document.cookie);
    await checkAuthentication(email);
    isAuthenticated = true;
} catch (error) {
    isAuthenticated = false;
}

async function handlePublicAuth() {
    let {userId} = parseCookies(document.cookie)

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
            {spaceId, resAuth},
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
            {spaceId, resAuth, register: true},
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

webAssistantModule = require("assistos").loadModule("webassistant", assistOS.securityContext);
if (!chatId) {
    const userChats = await webAssistantModule.getUserChats(spaceId, webAssistantId, assistOS.securityContext.userId);
    if (!userChats || !userChats.length) {
        chatId = await webAssistantModule.createControlRoom(spaceId, webAssistantId, assistOS.securityContext.userId);
    } else {
        chatId = userChats[0];
    }
    document.cookie = `chatId=${chatId}; path=/; max-age=31536000`;
} else {
    try {
        const chatModule = require("assistos").loadModule("chat", assistOS.securityContext);
        const chatHistory = await chatModule.getChatHistory(spaceId, chatId);
    } catch (error) {
        document.cookie = `chatId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        const userChats = await webAssistantModule.getUserChats(spaceId, webAssistantId, assistOS.securityContext.userId);
        if (!userChats || !userChats.length) {
            chatId = await webAssistantModule.createControlRoom(spaceId, webAssistantId, assistOS.securityContext.userId);
        } else {
            chatId = userChats[0];
        }
        document.cookie = `chatId=${chatId}; path=/; max-age=31536000`;
    }
}

await launchAssistant(chatId);









