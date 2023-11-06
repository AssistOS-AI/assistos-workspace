import {extractFormInformation, parseURL} from "../../../imports.js";

export class chatbotsPage {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
        let personalityId = parseURL();
        this.personality = webSkel.space.getPersonality(personalityId);
    }
    beforeRender() {
      this.conversation = `
      <div class="chat-box-container user">
                <div class="chat-box user-box">Hi how are u</div>
            </div>
            <div class="chat-box-container robot">
                <div class="chat-box robot-box">Im fine and you?
                how was your day?</div>
            </div>
      `;
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

    async sendMessage(_target){
        let formInfo = extractFormInformation(_target);
        let scriptId = webSkel.space.getScriptIdByName("chat");
        let response = await webSkel.getService("LlmsService").callScript(scriptId,this.personality.name, this.personality.description);
    }
}