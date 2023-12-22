export class Bot{
    constructor(data) {
        this.personalityId = data.personalityId;
        this.currentConversationId = data.currentConversationId || "";
        this.conversations = data.conversations || [];
    }
    addConversation(){
        this.conversations.push({
            id:webSkel.getService("UtilsService").generateId(),
            history: [],
            context: [],
            wordCount: 0,
            currentEmotion: {
                name: ". . .",
                emoji: "&#128578;"
            },
            lastInteraction: new Date(),
            creationDate: new Date()
        })
    }
    getConversation(id){

    }
    async addMessage(role, content, conversationId){
        if(!["assistant","user","system"].includes(role)){
            console.error(`Chatbots history: role must be either assistant, user or system. Message: ${content}`);
        }
        let conversation = this.getConversation(conversationId);
        let words = content.split(" ");
        conversation.wordCount += words.length;
        conversation.history.push({role:role,content:content});
        //await storageManager.storeObject(webSkel.currentUser.space.id, "status", "status", JSON.stringify(webSkel.currentUser.space.getSpaceStatus(),null,2));
    }
    async setContext(context, conversationId){
        let conversation = this.getConversation(conversationId);
        conversation.context[0] = {role:"system", content: context};
        let words = context.split(" ");
        conversation.wordCount = words.length;
        //await storageManager.storeObject(webSkel.currentUser.space.id, "status", "status", JSON.stringify(webSkel.currentUser.space.getSpaceStatus(),null,2));
    }
    getContext(conversationId){
        let conversation = this.getConversation(conversationId);
        if(conversation.context.length > 0){
            return conversation.context;
        }else {
            return conversation.history;
        }
    }
    async createOpener(){
        let message = "Hello!";
        let flowId = webSkel.currentUser.space.getFlowIdByName("Chatbots");
        return await webSkel.getService("LlmsService").callFlow(flowId, message, this.personalityId, "");
    }
}