async function ChatPlugin() {
    const self = {};

    const AgentPlugin = await $$.loadPlugin("AgentWrapper");
    const Workspace = await $$.loadPlugin("WorkspacePlugin");
    const Llm = await $$.loadPlugin("LLM");

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
            const contextChapter = chat.chapters.find(chapter => chapter.name === "Context");
            if (!contextChapter) {
                throw new Error("Context chapter not found");
            }
            let promises = [];
            preferences.forEach((preference,index) => {
                promises.push(Workspace.createParagraph(contextChapter.id, preference, {replay: {role: "assistant"}}, {},index+contextChapter.paragraphs.length));
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
            }else{
                throw new Error("Llm response object does not contain preferences property or is not an array");
            }
        } else {
            throw new Error("Llm response object does not contain detectedPreferences property");
        }
    }

    self.getChat = async function (chatId) {
        return await Workspace.getDocument(chatId);
    }
    self.getChatMessages = async function (chatId) {
        const chat = await Workspace.getDocument(chatId);
        const messagesChapter = chat.chapters.find(chapter => chapter.name === "Messages");
        if (!messagesChapter) {
            throw new Error("Messages chapter not found");
        }
        return messagesChapter.paragraphs;
    }
    self.getChatContext = async function (chatId) {
        const chat = await Workspace.getDocument(chatId);
        const contextChapter = chat.chapters.find(chapter => chapter.name === "Context");
        if (!contextChapter) {
            throw new Error("Context chapter not found");
        }
        return contextChapter.paragraphs;
    }

    self.createChat = async function (docId) {
        const document = await Workspace.createDocument(docId, "chat");
        await Promise.all([
            Workspace.createChapter(document.id, "Messages", {}, [], 0),
            Workspace.createChapter(document.id, "Context", {}, [], 1)
        ]);
        return document.id;
    }
    self.deleteChat = async function (chatId) {
        return await Workspace.deleteDocument(chatId);
    }
    self.resetChat = async function (chatId) {
        const chat = await Workspace.getDocument(chatId);
        const messagesChapter = chat.chapters.find(chapter => chapter.name === "Messages");
        const contextChapter = chat.chapters.find(chapter => chapter.name === "Context");

        return await Promise.all([
            ...messagesChapter.paragraphs.map(paragraph => Workspace.deleteParagraph(messagesChapter.id, paragraph.id)),
            ...contextChapter.paragraphs.map(paragraph => Workspace.deleteParagraph(contextChapter.id, paragraph.id))
        ]);
    }

    self.resetChatContext = async function (chatId) {
        const chat = await Workspace.getDocument(chatId);
        const contextChapter = chat.chapters.find(chapter => chapter.name === "Context");
        if (!contextChapter) {
            throw new Error("Context chapter not found");
        }
        await Promise.all([
            ...contextChapter.paragraphs.map(paragraph => Workspace.deleteParagraph(contextChapter.id, paragraph.id))
        ]);
    }
    self.resetChatMessages = async function (chatId) {
        const chat = await Workspace.getDocument(chatId);
        const messagesChapter = chat.chapters.find(chapter => chapter.name === "Messages");
        if (!messagesChapter) {
            throw new Error("Messages chapter not found");
        }
        await Promise.all([
            ...messagesChapter.paragraphs.map(paragraph => Workspace.deleteParagraph(messagesChapter.id, paragraph.id))
        ]);
    }

    self.addPreferenceToContext = async function (chatId, message) {
        const chat = await Workspace.getDocument(chatId);
        const contextChapter = chat.chapters.find(chapter => chapter.name === "Context");
        if (!contextChapter) {
            throw new Error("Context chapter not found");
        }
        return await Workspace.createParagraph(contextChapter.id, message, {replay: {role: "assistant"}}, {});
    }
    self.deletePreferenceFromContext = async function (chatId, messageId) {
        const chat = await Workspace.getDocument(chatId);
        const contextChapter = chat.chapters.find(chapter => chapter.name === "Context");
        if (!contextChapter) {
            throw new Error("Context chapter not found");
        }
        return await Workspace.deleteParagraph(contextChapter.id, messageId);
    }

    self.addMessageToContext = async function (chatId, messageId) {
        const chat = await Workspace.getDocument(chatId);
        const contextChapter = chat.chapters.find(chapter => chapter.name === "Context");
        const messageChapter = chat.chapters.find(chapter => chapter.name === "Messages");
        if (!contextChapter) {
            throw new Error("Context chapter not found");
        }
        if (!messageChapter) {
            throw new Error("Messages chapter not found");
        }

        const message = messageChapter.paragraphs.find(paragraph => paragraph.id === messageId);

        if (!message) {
            throw new Error("Message not found");
        }

        message.commands.replay.isContext = true;
        await Workspace.updateParagraph(messageChapter.id, messageId, message.text, message.commands, message.comments);

        return await Workspace.createParagraph(contextChapter.id, message.text, {
            replay: {
                role: "assistant",
                isContextFor: message.id
            }
        }, {});
    }
    self.removeMessageFromContext = async function (chatId, messageId) {
        const chat = await Workspace.getDocument(chatId);
        const contextChapter = chat.chapters.find(chapter => chapter.name === "Context");
        const messageChapter = chat.chapters.find(chapter => chapter.name === "Messages");
        if (!contextChapter) {
            throw new Error("Context chapter not found");
        }
        if (!messageChapter) {
            throw new Error("Messages chapter not found");
        }
        const contextMessage = contextChapter.paragraphs.find(paragraph => paragraph.id === messageId);
        const referenceMessage = messageChapter.paragraphs.find(paragraph => paragraph.id === contextMessage.commands.replay.isContextFor);

        referenceMessage.commands.replay.isContext = false;
        await Workspace.updateParagraph(messageChapter.id, referenceMessage.id, referenceMessage.text, referenceMessage.commands, referenceMessage.comments);

        return await Workspace.deleteParagraph(contextChapter.id, messageId);
    }
    self.updateChatContextItem = async function (chatId, contextItemId, newText) {
        const chat = await Workspace.getDocument(chatId);
        const contextChapter = chat.chapters.find(chapter => chapter.name === "Context");
        if (!contextChapter) {
            throw new Error("Context chapter not found");
        }
        const contextItem = contextChapter.paragraphs.find(paragraph => paragraph.id === contextItemId);
        if (!contextItem) {
            throw new Error("Context item not found");
        }
        return await Workspace.updateParagraph(contextChapter.id, contextItemId, newText, contextItem.commands, contextItem.comments);
    }

    self.addChatToAgent = async function (agentId, chatId) {
        return await AgentPlugin.addChat(agentId, chatId)
    }
    self.removeChatFromAgent = async function (agentId, chatId) {
        let agent = await AgentPlugin.getAgent(agentId);
        agent.chats = agent.chats.filter(c => c !== chatId);
        agent.selectedChat = agent.chats[0]
        await AgentPlugin.updateAgent(agent.id, {...agent});
    }
    self.sendMessage = async function (chatId, userId, message, role) {
        const chat = await Workspace.getDocument(chatId);
        let chapterId;
        if (chat.chapters.length === 0) {
            [chapterId] = await Promise.all([
                    Workspace.createChapter(chatId, "Messages", {}, [], 0),
                    Workspace.createChapter(chatId, "Context", {}, [], 1)
                ]
            )
        } else {
            chapterId = chat.chapters.find(chapter => chapter.name === "Messages")?.id;
        }
        if(!chapterId) {
            throw new Error("Messages chapter not found");
        }

        return await Workspace.createParagraph(chapterId, message, {replay: {role, name: userId}}, {});
    }

    self.sendQuery = async function (chatId, personalityId, userId, userPrompt) {
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
            const {chatPrompt, contextSize} = await AgentPlugin.getAgent(agentId);


            const contextChapter = chat.chapters.find(chapter => chapter.name === "Context");
            const messagesChapter = chat.chapters.find(chapter => chapter.name === "Messages");

            const context = {
                messages: messagesChapter?.paragraphs.slice(-contextSize, messagesChapter.paragraphs.length) || [],
                context: contextChapter ? chat.chapters[1].paragraphs : []
            }
            return context;
        }

        let {chatPrompt, description} = await AgentPlugin.getAgent(personalityId);

        chatPrompt = unSanitize(chatPrompt);
        userPrompt = unSanitize(userPrompt);
        description = unSanitize(description);

        const context = buildContext(chatId, personalityId);

        const combinedQueryPrompt = applyChatPrompt(chatPrompt, userPrompt, context, description);

        const llmRes = await Llm.generateText(combinedQueryPrompt)

        await self.sendMessage(chatId, userId, llmRes, "assistant");

        await checkApplyContextInstructions(chatId, userPrompt, userId);
    }
    self.sendStreamingQuery = async function (chatId, personalityId, userId, userPrompt) {
        /*TODO: TBD when a streaming strategy is implemented */
        return self.sendQuery(chatId, personalityId, userId, userPrompt);
    }

    return self;
}

let singletonInstance;

module.exports = {
    getInstance: async function () {
        if(!singletonInstance){
            singletonInstance = await ChatPlugin();
        }
        return singletonInstance;
    },
    getAllow: function () {
        return async function (globalUserId, email, command, ...args) {
            return true;
        }
    },
    getDependencies: function () {
        return ["WorkspacePlugin", "AgentWrapper", "LLM"];
    }
}