import {
    customTrim,
    extractFormInformation,
    getClosestParentElement,
    parseURL,
    sanitize,
    showModal
} from "../../../imports.js";

export class agentPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.agent=webSkel.currentUser.space.getDefaultAgent();
        this.invalidate();
    }
    beforeRender() {
        let stringHTML = "";
        for(let reply of this.agent.conversationHistory){
            if(reply.role === "user"){
                stringHTML += `
                <div class="chat-box-container user">
                 <div class="chat-box user-box">${reply.content}</div>
                </div>`;
            }else {
                stringHTML += `
                <div class="chat-box-container robot">
                 <div class="chat-box robot-box">${reply.content}</div>
                </div>`;
            }
        }
        this.conversationHistory = stringHTML;
    }
    resizeTextarea(){
        //this.style.height = 'auto';
        //this.style.height = (this.scrollHeight) + 'px';
    }
    afterRender(){
        this.conversation = this.element.querySelector(".conversation");
        this.userInput = this.element.querySelector("#input");
        this.userInput.removeEventListener("keypress", this.boundFn);
        this.boundFn = this.preventRefreshOnEnter.bind(this);
        this.userInput.addEventListener("keypress", this.boundFn);
        this.userInput.removeEventListener("input", this.resizeTextarea);
        this.userInput.addEventListener("input", this.resizeTextarea);
        setTimeout(async ()=>{
            if(this.agent.conversationHistory.length === 0){
                await webSkel.getService("AgentService").initOpeners();
                let message = this.agent.getRandomOpener();
                await this.displayMessage("assistant", message);
            }
        },0);

    }
    async displayMessage(role, text){
        let reply;
        await this.agent.addReply(role, text);
        if(role === "user"){
            reply = `
                <div class="chat-box-container user">
                 <div class="chat-box user-box">${text}</div>
                </div>`;

        }else {
            reply = `
                <div class="chat-box-container robot">
                 <div class="chat-box robot-box">${text}</div>
                </div>`;
        }
        this.conversation.insertAdjacentHTML("beforeend", reply);
        const lastReplyElement = this.conversation.lastElementChild;
        lastReplyElement.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
    }
    preventRefreshOnEnter(event){
        if(event.key === "Enter" && !event.ctrlKey){
            event.preventDefault();
            this.element.querySelector(".send-message-btn").click();
        }
        if(event.key === "Enter" && event.ctrlKey){
            this.userInput.value += '\n';
        }
    }
    async sendMessage(_target){
        let formInfo = await extractFormInformation(_target);
        let userPrompt = sanitize(customTrim(formInfo.data.input));
        formInfo.elements.input.element.value = "";
        if(userPrompt==="") {
            return;
        }
        await this.displayMessage("user", userPrompt);
        let response = await webSkel.getService("AgentService").analyzeRequest(formInfo.data.input);
        let agentMessage=response.responseJson ? JSON.stringify(response.responseJson) : response.responseString;
        await this.displayMessage("assistant", agentMessage);

    }

    async resetConversation(){
        await this.agent.resetConversationHistory();
        this.invalidate();
    }
}