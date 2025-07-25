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

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
};

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

async function checkAuthentication(email) {
    assistOS.user = await userModule.loadUser(email);
    assistOS.globalRoles = await userModule.getGlobalRoles();
    assistOS.securityContext = {
        email: assistOS.user.email,
        userId: assistOS.user.id,
    }
}

const launchAssistant = async (chatId) => {
    let {userId} = assistOS.securityContext;
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

async function handlePublicAuth() {
    let {userId} = parseCookies(document.cookie)

    if (!userId) {
        //await createGuestUser();
    }
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

let {chatId} = parseCookies(document.cookie);

if(!chatId){
    const chatModule = require("assistos").loadModule("chat", assistOS.securityContext);
    const scriptCode = "@history new Table from message timestamp role\n" +
        "@context new Table from message timestamp role\n" +
        "@currentUser := $arg1\n" +
        "@agentName := $arg2\n" +
        "@assistant new ChatAIAgent $agentName\n" +
        "@user new ChatUserAgent $currentUser\n" +
        "@chat new Chat $history $context $user $assistant\n" +
        "\n" +
        "context.upsert system [ assistant.getSystemPrompt ] \"\" system\n" +
        "@newReply macro reply ~history ~context ~chat ~assistant\n" +
        "    @res history.upsert $reply\n" +
        "    context.upsert $res\n" +
        "    chat.notify $res\n" +
        "    return $res\n" +
        "end"
        chatId = generateId(16);

    const chatScript = await chatModule.createChatScript(spaceId,`DefaultAssistantScript_${chatId}`, scriptCode, "DefaultAssistantScript");
    try {
        let res = await chatModule.createChat(spaceId, chatId, chatScript.id, ["User", "Assistant"]);
        document.cookie = `chatId=${chatId}`;
    }catch(err){
        console.log(err);
    }
}

await launchAssistant(chatId);









