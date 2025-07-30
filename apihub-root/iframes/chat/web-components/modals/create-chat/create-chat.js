let chatModule = require("assistos").loadModule("chat", assistOS.securityContext);
let agentModule = require("assistos").loadModule("agent", assistOS.securityContext);
let webAssistantModule = require("assistos").loadModule("webassistant", assistOS.securityContext);

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
        let scripts = await chatModule.getChatScriptNames(window.spaceId);
        let agents = await agentModule.getAgentNames(window.spaceId);
        this.scriptOptions = scripts.map(scriptName =>
            `<option value="${scriptName}">${scriptName}</option>`
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
        let chatId = formInfo.data.agent + "_Chat_" + generateId(8);
        let scriptName = UI.unsanitize(formInfo.data.scriptName);
        await webAssistantModule.createChat(this.spaceId,this.assistantId,assistOS.securityContext.userId,{
            chatId,
            scriptName,
            args:["User", formInfo.data.agent]
        })
        UI.closeModal(this.element, chatId);
    }

    closeModal(_target) {
        UI.closeModal(_target);
    }
}