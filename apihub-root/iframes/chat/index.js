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

const urlParams = new URLSearchParams(window.location.search);

let chatId = urlParams.get("chatId") || null;
const personalityId = urlParams.get("personalityId") || null;
const spaceId = urlParams.get("spaceId") || null;

const appContainer = document.getElementById('app-container');

const initializeChat = async function () {
    let {userId = null} = parseCookies(document.cookie)

    if (userId === null) {
        userId = generateId()
        setCookie("userId", userId)
    }

    if (!chatId) {
        let cookies = parseCookies(document.cookie)
        chatId = cookies.chatId
    }

    if (!chatId) {
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

    appContainer.innerHTML = `<chat-page data-chatId="${chatId}" data-personalityId="${personalityId}" data-spaceId="${spaceId}" data-userId="${userId}" data-presenter="chat-page"></chat-page>`
}

if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.register('./serviceWorker.js');
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



await initializeChat();
