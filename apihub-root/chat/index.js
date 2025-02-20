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

const initializeChat = async function(){
    const appContainer = document.getElementById('app-container');
    const {chatId=null} = parseCookies(document.cookie)

    const urlParams = new URLSearchParams(window.location.search);

    const personalityId = urlParams.get("personalityId")||null;
    const spaceId = urlParams.get("spaceId")||null;

    appContainer.innerHTML = `<chat-page data-chatId="${chatId}" data-personalityId="${personalityId}" data-spaceId="${spaceId}" data-presenter="chat-page"></chat-page>`
}


await initializeChat();
