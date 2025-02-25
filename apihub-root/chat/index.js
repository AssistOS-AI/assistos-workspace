import UI from "../WebSkel/webSkel.js";

const UIConfigsPath = './chat-configs.json'
window.UI = new UI();
await UI.initialise(UIConfigsPath);

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

const initializeChat = async function(){
    const appContainer = document.getElementById('app-container');
    let {chatId=null,userId=null} = parseCookies(document.cookie)

    if(userId === null){
        userId = generateId()
        setCookie("userId",userId)
    }

    const urlParams = new URLSearchParams(window.location.search);

    const personalityId = urlParams.get("personalityId")||null;
    const spaceId = urlParams.get("spaceId")||null;

    appContainer.innerHTML = `<chat-page data-chatId="${chatId}" data-personalityId="${personalityId}" data-spaceId="${spaceId}" data-userId="${userId}" data-presenter="chat-page"></chat-page>`
}


await initializeChat();
