import UI from "../../WebSkel/webSkel.js";

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

function setCookie(key, value, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
};


async function getChatId(spaceId, personalityId) {
    let chatId = urlParams.get("chatId") || null;
    if (!chatId) {
        let cookies = parseCookies(document.cookie)
        chatId = cookies.chatId
    }
    if (!chatId || chatId === "null") {
        try {
            const response = await fetch(`/public/chats/${spaceId}/${personalityId}`, {
                method: "POST",
                headers: {'Content-Type': 'application/json'}
            })
            chatId = (await response.json()).data.chatId;
            setCookie("chatId", chatId)
        } catch (error) {
            alert(`Failed to create chat session. Encountered error:${error.message}`);
            setCookie("chatId", null)
        }
    }
    return chatId;
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

const webComponentsRootDir = './web-components';

window.UI.loadWidget = async function (spaceId, applicationId, widgetName, UI = window.UI) {
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

    await UI.defineComponent(component);

    return component;
}
const userModule = require("assistos").loadModule("user", {});
const webAssistantModule = require("assistos").loadModule("webassistant", {});

const cacheNames = await caches.keys();
await Promise.all(cacheNames.map(name => caches.delete(name)));

async function createGuestUser() {
    const response = await fetch("/users/guest", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
    })
    if (!response.ok) {
        throw new Error(`Failed to create guest user: ${response.statusText}`);
    }
}

async function checkAuthentication(email) {
    assistOS.user = await userModule.loadUser(email);
    assistOS.globalRoles = await userModule.getGlobalRoles();
    assistOS.securityContext = {
        email: assistOS.user.email,
        userId: assistOS.user.id,
    }
}

const launchAssistant = async (chatId) => {
    /*   if (!chatId) {
           const chatModule = require("assistos").loadModule("chat", assistOS.securityContext);
           const userChats = await chatModule.getChats(spaceId);
           if (userChats.length > 0) {
               chatId = userChats[0].id;
           } else {
               chatId = await chatModule.createUserChat(spaceId, userId);
           }
       }*/
    let userId = "default"
    return window.UI.createElement(
        'chat-page',
        appContainer,
        {chatId, webAssistantId, spaceId, userId, pageId},
        {
            "data-chatId": chatId,
            "data-webAssistantId": webAssistantId,
            "data-spaceId": spaceId,
            "data-userId": userId,
            "data-pageId": pageId
        },
        true
    );
}


window.assistOS = {};
assistOS.securityContext = {};


const urlParams = new URLSearchParams(window.location.search);

const webAssistantId = urlParams.get("webAssistant");
const spaceId = urlParams.get("space");

window.spaceId = spaceId;
const pageId = urlParams.get("page") || null;
const appContainer = document.getElementById('app-container');

const authType = await webAssistantModule.getAuth(spaceId, webAssistantId)

let isAuthenticated = false;
try {
    const {email} = parseCookies(document.cookie);
    await checkAuthentication(email);
    isAuthenticated = true;
} catch (error) {
    isAuthenticated = false;
}

let {chatId} = parseCookies(document.cookie);


async function handlePublicAuth() {
    let {userId} = parseCookies(document.cookie)

    if (!userId) {
        //await createGuestUser();
    }
    await launchAssistant(chatId);
}

async function handleExistingSpaceMembersAuth() {
    if(!isAuthenticated) {
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
        await launchAssistant(chatId);
    }else{
        await launchAssistant(chatId);
    }

}

async function handleNewAndExistingSpaceMembersAuth() {
    if(!isAuthenticated) {
        let resAuth;
        const authenticatedPromise = new Promise((resolve, reject) => {
            resAuth = resolve;
        })
        window.UI.createElement(
            'login-page',
            appContainer,
            {spaceId, resAuth,register: true},
            {
                "data-spaceId": spaceId
            },
            true
        );
        await authenticatedPromise;
        await launchAssistant(chatId);
    }else{
        await launchAssistant(chatId);
    }
}

switch(authType){
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









