const path = require("path");
const {promises: fsPromises} = require("fs");
const defaultModels = require("../defaultModels");
const storage = require("../../apihub-component-utils/storage");


async function AgentWrapper() {
    let self = {};
    let AgentPlugin = await $$.loadPlugin("AgentPlugin");
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

    self.updateAgent = async function(id, values) {
        return await AgentPlugin.updateAgent(id, values);
    }

    // TODO:  Using function expressions inside a factory pattern causes ordering issues when methods reference each other. Isn't it better to use classes, or at least function declarations for hoisting?

    self.addChat = async function(id,chatId){
        const agent = await self.getAgent(id);
        if (!agent.chats) {
            agent.chats = [];
        }

        agent.chats.push(chatId);
        agent.selectedChat = chatId;

        await self.updateAgent(agent.id, {...agent});
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

    self.deleteAgent = async function(id) {
        return await AgentPlugin.deleteAgent(id);
    }

    self.getConversationIds = async function (id) {
        const agent = await self.getAgent(id)
        return agent.chats;
    }

    self.getAllAgentObjects = async function() {
        return await AgentPlugin.getAllAgentObjects();
    }
    self.getAllAgents = async function() {
        return await AgentPlugin.getAllAgents();
    }
    self.getAllAgentObjects = async function() {
        return await AgentPlugin.getAllAgentObjects();
    }
    self.createAgent = async function (name, description) {
        return await AgentPlugin.createAgent(name, description);
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
        return ["AgentPlugin"];
    }
}
