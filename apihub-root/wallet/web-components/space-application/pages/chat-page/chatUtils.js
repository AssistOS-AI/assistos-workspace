

const generateRequest = function (method, headers = {}, body = null) {
    return async function (url) {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });
        return response.json();
    };
};

const addToLocalContext = async (spaceId, chatId, messageId) => {
    const request = generateRequest("POST", {"Content-Type": "application/json"});
    const response = await request(`/chats/context/${spaceId}/${chatId}/${messageId}`);
}
const createNewChat = async (spaceId, personalityId) => {

};

const resetChat = (spaceId, chatId) => {
    const request = generateRequest("POST", {"Content-Type": "application/json"})
    return request(`/chats/reset/${spaceId}/${chatId}`)
}

const resetChatContext = (spaceId, chatId) => {
    const request = generateRequest("POST", {"Content-Type": "application/json"})
    return request(`/chats/reset/context/${spaceId}/${chatId}`)
}

const sendMessageActionButtonHTML = `  
<button type="button" id="stopLastStream" data-local-action="sendMessage">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="white"/>
    </svg>
</button>
`

const stopStreamActionButtonHTML = `
<button type="button" id="stopLastStream" data-local-action="stopLastStream">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-lg"><rect x="7" y="7" width="10" height="10" rx="1.25" fill="white"></rect></svg>
</button>
`

const chatOptions = `
    <list-item data-local-action="newConversation" data-name="New Conversation" data-highlight="light-highlight"></list-item>
                        <list-item data-local-action="resetConversation" data-name="Reset Conversation" data-highlight="light-highlight"></list-item>
                        <list-item data-local-action="resetLocalContext" data-name="Reset Agent Context" data-highlight="light-highlight"></list-item>
                        <list-item data-local-action="viewAgentContext" data-name="Edit Agent Context" data-highlight="light-highlight"></list-item>
                        <list-item data-local-action="uploadFile" data-name="Upload File" data-highlight="light-highlight"></list-item>
                        <input type="file" class="file-input hidden">
`
const IFrameChatOptions = `
<list-item data-local-action="newConversation" data-name="New Conversation" data-highlight="light-highlight"></list-item>
<list-item data-local-action="resetConversation" data-name="Reset Conversation" data-highlight="light-highlight"></list-item>
                        <list-item data-local-action="resetLocalContext" data-name="Reset Agent Context" data-highlight="light-highlight"></list-item>
                        <list-item data-local-action="viewAgentContext" data-name="Edit Agent Context" data-highlight="light-highlight"></list-item>
`

const getChatItemRole = function (chatItem) {
    return chatItem.commands?.replay?.role || null;
}
const getChatItemUser = function (chatItem) {
    return chatItem.commands?.replay?.name || null;
}

const waitForElement = (container, selector) => {
    return new Promise((resolve, reject) => {
        const element = container.querySelector(selector);
        if (element) {
            resolve(element);
        } else {
            const observer = new MutationObserver((mutations, me) => {
                const element = container.querySelector(selector);
                if (element) {
                    me.disconnect();
                    resolve(element);
                }
            });
            observer.observe(container, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} did not appear in time`));
            }, 10000);
        }
    });
};
export default{
    generateRequest,
    addToLocalContext,
    createNewChat,
    resetChat,
    resetChatContext,
    sendMessageActionButtonHTML,
    stopStreamActionButtonHTML,
    chatOptions,
    IFrameChatOptions,
    getChatItemRole,
    getChatItemUser,
    waitForElement
}