const path = require("path");
const {promises: fsPromises} = require("fs");
const defaultModels = require("../defaultModels");
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
    self.createAgentFromFile = async function (agentsFolder, entry) {
        const filePath = path.join(agentsFolder, entry.name);
        let agent = JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
        agent.llms = defaultModels;
        let imagesPath = path.join(agentsFolder, 'images');
        let imageBuffer = await fsPromises.readFile(path.join(imagesPath, `${agent.imageId}.png`));

        //personality.imageId = await spaceModule.putImage(imageBuffer);
        await AgentPlugin.createAgent(agent);
    }
    self.getAgent = async function(id) {
        //id can be name
        return await AgentPlugin.getAgent(id);
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
