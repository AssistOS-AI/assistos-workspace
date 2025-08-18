let agentModule = require("assistos").loadModule("agent", assistOS.securityContext);
let chatModule = require("assistos").loadModule("chat", assistOS.securityContext);

function generateId(length = 16) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    const bytes = new Uint8Array(length)
    crypto.getRandomValues(bytes)
    let id = ''
    for (let i = 0; i < length; i++) {
        id += alphabet[bytes[i] % alphabet.length]
    }
    return id
}

export class CreateChat {
    constructor(element, invalidate,props) {
        this.element = element;
        this.invalidate = invalidate;
        this.assistantId = this.element.getAttribute("data-assistant-id")
        this.spaceId = this.element.getAttribute("data-space-id");
        this.invalidate();
    }

    async beforeRender() {
        let scripts = await chatModule.getChatScripts(window.spaceId);
        let agents = await agentModule.getAgentNames(window.spaceId);
        this.scriptOptions = scripts.map(script=>
            `<option value="${script.id}">${script.name}</option>`
        ).join('');
        this.agentOptions = agents.map(agentName =>
            `<option value="${agentName}">${agentName}</option>`
        ).join('');
    }

    afterRender() {

    }

    async createChat() {
        let form = this.element.querySelector('form');
        let formInfo = await UI.extractFormInformation(form);
        if (!formInfo.isValid) {
            return;
        }
        let chatId = formInfo.data.agent + `_${assistOS.securityContext.userId}_` + generateId(8);
        let scriptId = UI.unsanitize(formInfo.data.scriptName);
        await webAssistantModule.createChat(this.spaceId,this.assistantId,assistOS.securityContext.userId,{
            id: chatId,
            scriptId: scriptId,
            args: ["User", formInfo.data.agent]
        })
        document.querySelector("chat-page")?.webSkelPresenter?.openChat(null, chatId);
    }

}