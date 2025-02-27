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

const getChatContext = async (spaceId, chatId) => {
    const request = generateRequest("GET");
    const response = await request(`/chats/context/${spaceId}/${chatId}`);
    return response.data;
}

const updateChatContextMessage = async (spaceId, chatId, contextItemId, context) => {
    const request = generateRequest("PUT", {'Content-Type': 'application/json'}, {context});
    const response = await request(`/chats/context/${spaceId}/${chatId}/${contextItemId}`);
    return response.data;
}
const deleteChatContextMessage = async (spaceId, chatId, contextItemId) => {
    const request = generateRequest("DELETE");
    const response = await request(`/chats/context/${spaceId}/${chatId}/${contextItemId}`);
    return response.data;
}

function debounce(func, wait) {
    let timeoutId = null;
    return function (...args){
        clearTimeout(timeoutId);
        return new Promise((resolve) => {
            timeoutId = setTimeout(() => {
                resolve(func.apply(this, args));
            }, wait);
        });
    };
}

const IFrameContext = window.assistOS === undefined;
const UI = IFrameContext ? window.UI : window.assistOS.UI

export class ViewContextModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.chatPagePresenter = document.querySelector('chat-page').webSkelPresenter
    }

    closeModal(_target) {
        UI.closeModal(_target);
    }

    async handleUpdate(event, key) {
        await updateChatContextMessage(this.spaceId, this.chatId, key, event.target.value);
    }

    async beforeRender() {
        this.chatId = this.element.getAttribute('data-chatId');
        this.spaceId = this.element.getAttribute('data-spaceId');

        this.context = await getChatContext(this.spaceId, this.chatId);

        this.viewContextItems = this.context.map((contextItem, index) => {
            return `<li class="view-item" data-key="${contextItem.id}"> 
                <span class="role">${contextItem.commands.replay.role}</span>
            <textarea 
            class="editContextItem" 
            data-key="${contextItem.id}">${contextItem.text}
            </textarea>
                        <button data-local-action="deleteItem">Delete</button>
            </li>`;
        }).join('') || `<span>No context Added</span>`;
    }


    async afterRender() {
        const self = this;
        this.element.querySelectorAll('.editContextItem').forEach(textArea => {
            const handleUpdate = debounce(this.handleUpdate, 1000);
            const key = textArea.getAttribute('data-key');
            textArea.addEventListener('input', function (event){
                handleUpdate.call(self,event, key);
            });
        })
    }

    async deleteItem(_target) {
        const targetIndex = _target.closest('li').getAttribute('data-key');
        await deleteChatContextMessage(this.spaceId, this.chatId, targetIndex);
        this.invalidate();
    }

}