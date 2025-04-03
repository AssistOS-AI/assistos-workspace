async function ChatPlugin() {
    const self = {};

    const AgentPlugin = await $$.loadPlugin("AgentWrapper");
    const Workspace = await $$.loadPlugin("WorkspacePlugin");

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

        await Promise.all([
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
        if(!contextChapter){
            throw new Error("Context chapter not found");
        }
        if(!messageChapter){
            throw new Error("Messages chapter not found");
        }

        const message = messageChapter.paragraphs.find(paragraph => paragraph.id === messageId);

        if(!message){
            throw new Error("Message not found");
        }

        message.commands.replay.isContext = true;
        await Workspace.updateParagraph(messageChapter.id, messageId, message.text, message.commands, message.comments);

        return await Workspace.createParagraph(contextChapter.id, message.text, {replay: {role: "assistant",isContextFor:message.id}}, {});
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

    self.removeChatFromAgent = async function (agentId, chatId) {
        let agent = await AgentPlugin.getAgent(agentId);
        agent.chats = agent.chats.filter(c => c !== chatId);
        agent.selectedChat = agent.chats[0]
        await AgentPlugin.updateAgent(agent.id, {...agent});
    }

    self.addChatToAgent = async function (agentId, chatId) {
        return  await AgentPlugin.addChat(agentId,chatId)
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
            chapterId = chat.chapters[0].id;
        }
        return await Workspace.createParagraph(chapterId, message, {replay: {role, name: userId}}, {});
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
        return ["WorkspacePlugin", "AgentWrapper"];
    }
}