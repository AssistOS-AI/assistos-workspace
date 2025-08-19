let chatModule = assistOS.loadModule("chat");
let agentModule = assistOS.loadModule("agent");
import {generateId} from "../../../../imports.js"
export class CreateChat {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    async beforeRender() {
        let scripts = await chatModule.getChatScriptNamesByRole(assistOS.space.id);
        let agents = await agentModule.getAgentNames(assistOS.space.id);
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
        let formInfo = await assistOS.UI.extractFormInformation(form);
        if(!formInfo.isValid){
            return;
        }
        let chatId = formInfo.data.agent + "_Chat_" + generateId(8);
        let scriptName = assistOS.UI.unsanitize(formInfo.data.scriptName);
        await chatModule.createChat(assistOS.space.id, chatId, scriptName, ["User", formInfo.data.agent]);
        assistOS.UI.closeModal(this.element, chatId);
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
}