const path = require("path");
const {promises: fsPromises} = require("fs");
const defaultModels = require("../defaultModels");
const storage = require("../../apihub-component-utils/storage");
const archiver = require("archiver");

async function AgentWrapper() {
    let self = {};

    let AgentPlugin = await $$.loadPlugin("AgentPlugin");
    let ChatPlugin = await $$.loadPlugin("ChatPlugin");
    const Llm = await $$.loadPlugin("LLM");

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

    self.updateAgent = async function (id, values) {
        return await AgentPlugin.updateAgent(id, values);
    }

    // TODO:  Using function expressions inside a factory pattern causes ordering issues when methods reference each other. Isn't it better to use classes, or at least function declarations for hoisting?

    self.addChat = async function (id, chatId) {
        const agent = await self.getAgent(id);
        if (!agent.chats) {
            agent.chats = [];
        }

        agent.chats.push(chatId);
        agent.selectedChat = chatId;

        await self.updateAgent(agent.id, {...agent});
    }
    self.addChatToAgent = async function (agentId, chatId) {
        return await self.addChat(agentId, chatId)
    }
    self.removeChatFromAgent = async function (agentId, chatId) {
        let agent = await self.getAgent(agentId);
        agent.chats = agent.chats.filter(c => c !== chatId);
        agent.selectedChat = agent.chats[0]
        await self.updateAgent(agent.id, {...agent});
    }
    self.createAgentFromFile = async function (agentsFolder, entry) {
        const filePath = path.join(agentsFolder, entry.name);
        let agent = JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
        agent.llms = defaultModels;
        let imagesPath = path.join(agentsFolder, 'images');
        let imageBuffer = await fsPromises.readFile(path.join(imagesPath, `${agent.imageId}.png`));

        //personality.imageId = await spaceModule.putImage(imageBuffer);
        const chatId = await ChatPlugin.createChat(agent.name);

        await AgentPlugin.createAgent(agent.name, agent.description, chatId);
    }
    self.getAgent = async function (id) {
        return await AgentPlugin.getAgent(id);
    }

    self.deleteAgent = async function (id) {
        return await AgentPlugin.deleteAgent(id);
    }

    self.getConversationIds = async function (id) {
        const agent = await self.getAgent(id)
        return agent.chats;
    }

    self.getAllAgentObjects = async function () {
        return await AgentPlugin.getAllAgentObjects();
    }
    self.getAllAgents = async function () {
        return await AgentPlugin.getAllAgents();
    }
    self.getAllAgentObjects = async function () {
        return await AgentPlugin.getAllAgentObjects();
    }
    self.createAgent = async function (name, description) {
        const chatId = await ChatPlugin.createChat(agent.name);
        return await AgentPlugin.createAgent(name, description, chatId);
    }

    self.getPersonalityImageUrl = async function (id) {
        const agent = await self.getAgent(id);
        const imageId = agent.imageId;
        return await storage.getDownloadURL("image/png", imageId);
    }
    self.exportPersonality = async function (id) {
        let agent = await self.getAgent(id);
        const contentBuffer = Buffer.from(JSON.stringify(agent), 'utf-8');
        const archive = archiver('zip', {zlib: {level: 9}});
        const stream = new require('stream').PassThrough();
        archive.pipe(stream);
        archive.append(contentBuffer, {name: 'data.json'});
        archive.finalize();
        return stream;
    }

    self.importAgent = async function (extractedPath) {
        const agentPath = path.join(extractedPath, 'data.json');
        const fileContent = await fsPromises.readFile(agentPath, 'utf8');
        const agentData = await JSON.parse(fileContent);
        const agents = await AgentPlugin.getAllAgentObjects();
        const existingAgent = agents.find(ag => ag.name === agentData.name);

        let agentId, overwritten = false;
        if (existingAgent) {
            agentData.id = existingAgent.id;
            await AgentPlugin.updateAgent(existingAgent.id, agentData);
            overwritten = true;
        } else {
            const chatId = await ChatPlugin.createChat(agentData.name);
            let agent = await AgentPlugin.createAgent(agentData.name, agentData.description, chatId);
            await AgentPlugin.updateAgent(agent.id, agentData);
            agentId = agent.id;
        }
        return {id: agentId, overwritten: overwritten, name: agentData.name};
    }
    self.sendQuery = async function (chatId, personalityId, userId, userPrompt) {
        const checkApplyContextInstructions = async function (chatId, prompt) {
            const generateMemoizationPrompt = (prompt) => `
        **Role**: You have received a query from the user and you need to check if the user's query contains general instructions, preferences of any kind that should be remembered and applied to future queries.
        **Current Query to Address (Begins with "<" and ends with ">"**: <"${prompt}">
        **Instructions**: 
        - Check the user's query for any general instructions, preferences, or any other information that should be remembered and applied to future queries and make a concise list item for each instruction.
        - Each item to remember will be as concise as possible and will be a single sentence.
        - You will only consider instructions or preferences that you consider important and relevant to the user's future queries, with an aim to avoid false positives and overfilling the context with irrelevant information.
        **Output Format**:
        - Should always return a VALID JSON string with the following format:
        {"detectedPreferences": true/false, "preferences": ["preference1", "preference2", ...]}
        - In no circumstance should the output be null, undefined,contain any metadata, meta-information or meta-commentary
        **Output Examples**:
        Example1:
        "{ "detectedPreferences": true,
            "preferences": [
            "User wants to be called by their first name",
            "User prefers to receive emails instead of calls"
            ]
        }"
        Example2:
        "{"detectedPreferences": false,"preferences":[]"}"
        `;
            const addPreferencesToContext = async function (chatId, preferences) {
                const chat = await Workspace.getDocument(chatId);
                const contextChapter = chat.chapters.find(chapter => chapter.title === "Context");
                if (!contextChapter) {
                    throw new Error("Context chapter not found");
                }
                let promises = [];
                preferences.forEach((preference, index) => {
                    promises.push(Workspace.createParagraph(contextChapter.id, preference, {replay: {role: "assistant"}}, {}, index + contextChapter.paragraphs.length));
                });

                return await Promise.all(promises);
            }

            const llmRes = await Llm.generateText(generateMemoizationPrompt(prompt));

            let parsedLlmAnswer;
            try {
                parsedLlmAnswer = JSON.parse(llmRes);
            } catch (error) {
                throw new Error("Error parsing LLM response: " + error.message);

            }
            if (parsedLlmAnswer.detectedPreferences) {
                if (Array.isArray(parsedLLMAnswer.preferences)) {
                    return await addPreferencesToContext(chatId, parsedLLMAnswer.preferences);
                } else {
                    throw new Error("Llm response object does not contain preferences property or is not an array");
                }
            } else {
                throw new Error("Llm response object does not contain detectedPreferences property");
            }
        }

        const unSanitize = function (value) {
            if (value != null && typeof value === "string") {
                return value.replace(/&nbsp;/g, ' ')
                    .replace(/&#13;/g, '\n')
                    .replace(/&amp;/g, '&')
                    .replace(/&#39;/g, "'")
                    .replace(/&quot;/g, '"')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>');
            }
            return '';
        }
        const applyChatPrompt = function (chatPrompt, userPrompt, context, personalityDescription) {
            return `${chatPrompt}
            **Your Identity**
            ${personalityDescription}
            **Previous Conversation**
            ${context.messages.map(message => `${message.commands?.replay?.role || "Unknown"} : ${message.text}`).join('\n')}
            **Conversation Context**
            ${context.context.map(contextItem => contextItem.text).join('\n')}
            **Current Query to Address**:
            ${userPrompt}
    `;
        }
        const buildContext = async function (chatId, agentId) {
            const chat = await Workspace.getDocument(chatId);
            const {chatPrompt, contextSize} = await AgentWrapper.getAgent(agentId);


            const contextChapter = chat.chapters.find(chapter => chapter.title === "Context");
            const messagesChapter = chat.chapters.find(chapter => chapter.title === "Messages");

            const context = {
                messages: messagesChapter?.paragraphs.slice(-contextSize, messagesChapter.paragraphs.length) || [],
                context: contextChapter ? chat.chapters[1].paragraphs : []
            }
            return context;
        }

        let {chatPrompt, description} = await AgentWrapper.getAgent(personalityId);

        chatPrompt = unSanitize(chatPrompt);
        userPrompt = unSanitize(userPrompt);
        description = unSanitize(description);

        const context = buildContext(chatId, personalityId);

        const combinedQueryPrompt = applyChatPrompt(chatPrompt, userPrompt, context, description);

        const llmRes = await Llm.generateText(combinedQueryPrompt)

        const message = await self.sendMessage(chatId, userId, llmRes, "assistant");

        await checkApplyContextInstructions(chatId, userPrompt, userId);
        return message;
    }

    self.sendStreamingQuery = async function (chatId, personalityId, userId, userPrompt) {
        /*TODO: TBD when a streaming strategy is implemented */
        return self.sendQuery(chatId, personalityId, userId, userPrompt);
    }

    const getCurrentAgentChatLlm = async function (agentId) {
        const agent = await AgentPlugin.getAgent(agentId);
        if (!agent) {
            throw new Error("Agent not found");
        }
        return await Llm.getRandomLlm(agent.selectedChatLlm);
    }

    const getApiKey = async function (provider) {
        const API_KEYS = JSON.parse(process.env.API_KEYS)
        const keyTypes = Object.values(API_KEYS)
        const apiKey= keyTypes.find(obj => {
            return obj.name === provider;
        })
        return apiKey.value;
    }
    self.sendChatQuery = async function (chatId, agentId, userId, prompt) {
        const model = await getCurrentAgentChatLlm(agentId);
        const apiKey = await getApiKey(model.provider);
        const llmResponse = await Llm.getChatCompletionResponse({
            provider: model.provider,
            model: model.name,
            apiKey,
            prompt
        })
        const message = await ChatPlugin.sendMessage(chatId, userId, llmResponse, "assistant");
        return message;
    }

    self.sendChatStreamingQuery = async function (chatId, personalityId, userId, userPrompt) {
        return await self.sendChatQuery(chatId, personalityId, userId, userPrompt);
    }
    return self;
}

let singletonInstance;
module.exports = {
    getInstance: async function () {
        if (!singletonInstance) {
            singletonInstance = await AgentWrapper();
        }
        return singletonInstance;
    },
    getAllow: function () {
        return async function (id, name, command, ...args) {
            return true;
        }
    },
    getDependencies: function () {
        return ["AgentPlugin", "ChatPlugin", 'LLM'];
    }
}
