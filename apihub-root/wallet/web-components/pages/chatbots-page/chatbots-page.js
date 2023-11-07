import {extractFormInformation, parseURL} from "../../../imports.js";

export class chatbotsPage {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
        let personalityId = parseURL();
        this.personality = webSkel.space.getPersonality(personalityId);
        this.history = [];
    }
    beforeRender() {
        let user = true;
        let stringHTML = "";
        for(let reply of this.history){
            if(user){
                stringHTML += `
                <div class="chat-box-container user">
                 <div class="chat-box user-box">${reply}</div>
                </div>`;
                user = false;
            }else {
                stringHTML += `
                <div class="chat-box-container robot">
                 <div class="chat-box robot-box">${reply}</div>
                </div>`;
                user = true;
            }
        }
      this.conversationHistory = stringHTML;
      this.emotions =`
      <div class="emotion">
        <div class="emotion-emoticon">&#128525;</div>
        <div class="emotion-name">Affection</div>
      </div>
      <div class="emotion">
        <div class="emotion-emoticon">&#128534;</div>
        <div class="emotion-name">Embarrassment</div>
      </div>
      `;
    }
    afterRender(){
        this.conversation = this.element.querySelector(".conversation");
    }
    displayMessage(text, role){
        let reply;
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
    }

    async sendMessage(_target){
        let formInfo = await extractFormInformation(_target);

        this.displayMessage(formInfo.data.input, "user");
        let scriptId = webSkel.space.getScriptIdByName("chatbots");
        let response = await webSkel.getService("LlmsService").callScript(scriptId, formInfo.data.input, this.personality.name, this.personality.description, this.history);
        this.history.push(formInfo.data.input);
        this.history.push(response.responseString);
        this.displayMessage(response.responseString, "robot");
    }
}