let chatModule = require("assistos").loadModule("chat",{});
let agentModule = require("assistos").loadModule("agent",{});

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
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
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
    async createChat(){
        let form = this.element.querySelector('form');
        let formInfo = await UI.extractFormInformation(form);
        if(!formInfo.isValid){
            return;
        }
        let chatId = formInfo.data.agent + "_Chat_" + generateId(8);
        let scriptName = UI.unsanitize(formInfo.data.scriptName);
        await chatModule.createChat(window.spaceId, chatId, scriptName, ["User", formInfo.data.agent]);
        UI.closeModal(this.element, chatId);
    }

    closeModal(_target) {
       UI.closeModal(_target);
    }
}