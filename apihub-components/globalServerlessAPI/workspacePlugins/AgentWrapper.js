const path = require("path");
const {promises: fsPromises} = require("fs");
const defaultModels = require("../defaultModels");
const storage = require("../../apihub-component-utils/storage");
async function AgentWrapper() {
    let self = {};
    let AgentPlugin = await $$.loadPlugin("AgentPlugin");
    let ChatPlugin = await $$.loadPlugin("ChatPlugin");
    self.copyDefaultAgents = async function (spacePath, spaceId) {
        let agentsFolder = '../apihub-components/globalServerlessAPI/default-agents';
        const files = await fsPromises.readdir(agentsFolder, {withFileTypes: true});

        let promises = [];
        for (const entry of files) {
            if (entry.isFile()) {
                promises.push(self.createAgentFromFile(agentsFolder, entry, spaceId));
            }
        }
        await Promise.all(promises);
    }
    self.createAgentFromFile = async function (agentsFolder, entry) {
        const filePath = path.join(agentsFolder, entry.name);
        let agent = JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
        agent.llms = defaultModels;
        let imagesPath = path.join(agentsFolder, 'images');
        let imageBuffer = await fsPromises.readFile(path.join(imagesPath, `${agent.imageId}.png`));

        //personality.imageId = await spaceModule.putImage(imageBuffer);
        await AgentPlugin.createAgent(agent.name, agent.description, agent);
    }
    self.getAgent = async function(id) {
        //id can be name
        return await AgentPlugin.getAgent(id);
    }
    self.updateAgent = async function(id, values) {
        return await AgentPlugin.updateAgent(id, values);
    }
    self.deleteAgent = async function(id) {
        return await AgentPlugin.deleteAgent(id);
    }
    self.getAllAgents = async function() {
        let agentIds = await AgentPlugin.getAllAgents();
        let agents = [];
        for(const agentId of agentIds){
            agents.push(await AgentPlugin.getAgent(agentId));
        }
        return agents;
    }
    self.createAgent = async function (name, description) {
        let agent = await AgentPlugin.createAgent(name, description);
        let chatId = await ChatPlugin.createChat(agent.id);
        await self.addChatToAgent(agent.id, chatId);
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
        const personalityData = await self.getAgent(id)
        return personalityData.chats;
    }

    self.ensureAgentChat = async function (id) {
        const agent = await self.getAgent(id)
        if (agent.chats === undefined) {
            let chatId = await ChatPlugin.createChat(id);
            await self.addChatToAgent(agent.id, chatId);
        }
    }

    self.ensureAgentsChats = async function () {
        const agents = await AgentPlugin.getAllAgents();
        for (const agentId of agents) {
            await self.ensureAgentChat(agentId);
        }
    }

    self.getPersonalityImageUrl = async function (id) {
        const agent = await self.getAgent(id);
        const imageId = agent.imageId;
        return await storage.getDownloadURL("image/png", imageId);
    }
    return self;
}

let singletonInstance;
module.exports = {
    getInstance: async function () {
        if(!singletonInstance){
            singletonInstance = await AgentWrapper();
        }
        return singletonInstance;
    },
    getAllow: function(){
        return async function(id, name, command, ...args){
            return true;
        }
    },
    getDependencies: function(){
        return ["AgentPlugin", "ChatPlugin"];
    }
}
