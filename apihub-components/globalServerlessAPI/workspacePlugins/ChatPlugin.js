const Document = require("../../document/services/document");
const Chapter = require("../../document/services/chapter");
async function SpaceInstancePersistence(){
    let self = {};
    let AgentPlugin = await $$.loadPlugin("AgentWrapper");

    self.createChat = async function (spaceId, personalityId) {
        const documentData = {
            title: `chat_${personalityId}`,
            topic: '',
            metadata: ["id", "title"]
        }
        const chatChapterData = {
            title: `Messages`,
            position: 0,
            paragraphs: []
        }
        const chatContextChapterData = {
            title: `Context`,
            position: 1,
            paragraphs: []
        }
        const chatId = await Document.createDocument(spaceId, documentData);

        const chatItemsChapterId = await Chapter.createChapter(spaceId, chatId, chatChapterData)
        const chatContextChapterId = await Chapter.createChapter(spaceId, chatId, chatContextChapterData)
        return chatId;
    }
    self.addChatToAgent = async function (agentId, chatId) {
        let agent = await AgentPlugin.getAgent(agentId);
        if (!agent.chats) {
            agent.chats = [];
        }
        agent.chats.push(chatId);
        agent.selectedChat = chatId;
        await AgentPlugin.updateAgent(agent.id);
    }

    self.getConversationIds = async function (id) {
        const agent = await self.getAgent(id)
        return agent.chats;
    }

    self.ensureAgentChat = async function (id) {
        const agent = await self.getAgent(id)
        if (agent.chats === undefined) {
            let chatId = await self.createChat(id);
            await self.addChatToAgent(agent.id, chatId);
        }
    }

    self.ensureAgentsChats = async function () {
        const agents = await AgentPlugin.getAllAgents();
        for (const agentId of agents) {
            await self.ensureAgentChat(agentId);
        }
    }
    return self;
}

module.exports = {
    getInstance: async function () {
        return await SpaceInstancePersistence();
    },
    getAllow: function(){
        return async function(globalUserId, email, command, ...args){
            return false;
        }
    },
    getDependencies: function(){
        return ["DefaultPersistence", "AgentWrapper"];
    }
}