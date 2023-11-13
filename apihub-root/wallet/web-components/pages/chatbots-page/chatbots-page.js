import {extractFormInformation, parseURL} from "../../../imports.js";

export class chatbotsPage {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
        let personalityId = parseURL();
        this.personality = webSkel.space.getPersonality(personalityId);
        this.cachedHistory = [];
        // this.history = [
        // {role: 'user', content: 'hello'},
        // {role: 'assistant', content: 'Hello! How can I assist you today?'},
        // {role: 'user', content: 'do you know the band tool?'},
        // {role: 'assistant', content: 'Yes, I am familiar with the band Tool. They are a …r your thoughts and experiences with their music!'}];
        // this.cachedHistory = this.history;
        // this.cachedEmotions = [
        //     {name:"Excitement",emoji:"🎉"},
        //     {name:"Curiosity",emoji:"🤔"},
        //     {name:"Passion",emoji:"🔥"}
        // ];
        this.history = [];
        this.cachedEmotions = [];
    }
    beforeRender() {
        let stringHTML = "";
        for(let reply of this.cachedHistory){
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
        let emotions = "";
        for(let emotion of this.cachedEmotions){
            emotions += `
            <div class="emotion">
             <div class="emotion-emoticon">${emotion.emoji}</div>
             <div class="emotion-name">${emotion.name}</div>
           </div>`;
        }
        this.savedEmotions = emotions;
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
    afterRender(){
        this.conversation = this.element.querySelector(".conversation");
        this.emotionsList = this.element.querySelector(".right-sidebar");
        this.userInput = this.element.querySelector("#input");
        let boundFn = this.preventRefreshOnEnter.bind(this);
        this.userInput.removeEventListener("keypress", boundFn);
        this.userInput.addEventListener("keypress", boundFn);
    }
    displayMessage(role, text){
        let reply;
        this.cachedHistory.push({role:role,content: text})
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

    displayEmotions(currentEmotions){
        this.emotionsList.textContent = "";
        let emotions = "";
        for(let emotion of currentEmotions){
            emotions += `
            <div class="emotion">
             <div class="emotion-emoticon">${emotion.emoji}</div>
             <div class="emotion-name">${emotion.name}</div>
           </div>`;
        }
        this.emotionsList.insertAdjacentHTML("beforeend", emotions);
    }
    async summarizeConversation(){
        let count = 0;
        for(let reply of this.history){
            count+= reply.content.length;
        }
        if(count < 500){
            return;
        }
      let scriptId = webSkel.space.getScriptIdByName("summarize conversation");
      let response = await webSkel.getService("LlmsService").callScript(scriptId, JSON.stringify(this.history));
      this.history = [];
      this.history.push(response.responseJson.summary[0]);
      this.history.push(response.responseJson.summary[1]);
    }
    async sendMessage(_target){
        let formInfo = await extractFormInformation(_target);
        let input = formInfo.data.input;
        formInfo.elements.input.element.value = "";
        this.displayMessage("user",input);
        let scriptId = webSkel.space.getScriptIdByName("chatbots");
        await this.summarizeConversation();

        let response = await webSkel.getService("LlmsService").callScript(scriptId, formInfo.data.input, this.personality.name, this.personality.description, this.history);

        this.history.push({role:"user",content:input});
        if(!response.responseJson){
            response.responseJson = {
                reply:"I'm sorry, I didn't understand what you said. Please repeat.",
                emotions:[{name:"Confused",emoji:"&#128533;"}]
            };
        }
        this.history.push({role:"assistant",content:response.responseJson.reply});
        this.displayMessage("assistant", response.responseJson.reply);
        this.displayEmotions(response.responseJson.emotions);
    }
}