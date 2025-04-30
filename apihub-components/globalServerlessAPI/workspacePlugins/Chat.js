async function Chat() {
    const self = {};

    const Document = await $$.loadPlugin("Documents");

    self.getChat = async function (chatId) {
        return await Document.getDocument(chatId);
    }
    self.getChatMessage = async function (chatId, messageId){
        return await Document.getParagraph(messageId);
    }
    self.getChatMessages = async function (chatId) {
        const chat = await Document.getDocument(chatId);
        const chapters = await Promise.all(chat.chapters.map(chapter => Document.getChapter(chapter)));
        const messagesChapter = chapters.find(chapter => chapter.title === "Messages");
        if (!messagesChapter) {
            throw new Error("Messages chapter not found");
        }
        return await Promise.all(messagesChapter.paragraphs.map(async (paragraph) => Document.getParagraph(paragraph)));
    }
    self.getChatContext = async function (chatId) {
        const chat = await Document.getDocument(chatId);
        const chapters = await Promise.all(chat.chapters.map(chapter => Document.getChapter(chapter)));
        const contextChapter = chapters.find(chapter => chapter.title === "Context");
        if (!contextChapter) {
            throw new Error("Context chapter not found");
        }
        return await Promise.all(contextChapter.paragraphs.map(async (paragraph) => Document.getParagraph(paragraph)));
    }

    self.createChat = async function (docId) {
        const document = await Document.createDocument(docId, "chat");
        await Promise.all([
            Document.createChapter(document.id, "Messages", "", [], 0),
            Document.createChapter(document.id, "Context", "", [], 1)
        ]);
        return document.id;
    }
    self.deleteChat = async function (chatId) {
        return await Document.deleteDocument(chatId);
    }

    self.resetChat = async function (chatId) {
        const chat = await Document.getDocument(chatId);
        const chapters = await Promise.all(chat.chapters.map(chapter => Document.getChapter(chapter)));
        const contextChapter = chapters.find(chapter => chapter.title === "Context");
        const messagesChapter= chapters.find(chapter => chapter.title === "Messages");

        return await Promise.all([
            ...messagesChapter.paragraphs.map(paragraph => Document.deleteParagraph(messagesChapter.id, paragraph.id)),
            ...contextChapter.paragraphs.map(paragraph => Document.deleteParagraph(contextChapter.id, paragraph.id))
        ]);
    }
    self.resetChatContext = async function (chatId) {
        const chat = await Document.getDocument(chatId);
        const chapters = await Promise.all(chat.chapters.map(chapter => Document.getChapter(chapter)));
        const contextChapter = chapters.find(chapter => chapter.title === "Context");
        if (!contextChapter) {
            throw new Error("Context chapter not found");
        }
        await Promise.all([
            ...contextChapter.paragraphs.map(paragraph => Document.deleteParagraph(contextChapter.id, paragraph.id))
        ]);
    }
    self.resetChatMessages = async function (chatId) {
        const chat = await Document.getDocument(chatId);
        const chapters = await Promise.all(chat.chapters.map(chapter => Document.getChapter(chapter)));
        const messagesChapter = chapters.find(chapter => chapter.title === "Messages");
        if (!messagesChapter) {
            throw new Error("Messages chapter not found");
        }
        await Promise.all([
            ...messagesChapter.paragraphs.map(paragraph => Document.deleteParagraph(messagesChapter.id, paragraph.id))
        ]);
    }

    self.addPreferenceToContext = async function (chatId, message) {
        const chat = await Document.getDocument(chatId);
        const chapters = await Promise.all(chat.chapters.map(chapter => Document.getChapter(chapter)));
        const contextChapter = chapters.find(chapter => chapter.title === "Context");
        if (!contextChapter) {
            throw new Error("Context chapter not found");
        }
        return await Document.createParagraph(contextChapter.id, message, {replay: {role: "assistant"}}, {});
    }
    self.deletePreferenceFromContext = async function (chatId, messageId) {
        const chat = await Document.getDocument(chatId);
        const chapters= await Promise.all(chat.chapters.map(chapter => Document.getChapter(chapter)));
        const contextChapter = chapters.find(chapter => chapter.title === "Context");
        if (!contextChapter) {
            throw new Error("Context chapter not found");
        }
        return await Document.deleteParagraph(contextChapter.id, messageId);
    }

    self.addMessageToContext = async function (chatId, messageId) {
        const chat = await Document.getDocument(chatId);
        const chapters = await Promise.all(chat.chapters.map(chapter => Document.getChapter(chapter)));
        const contextChapter = chapters.find(chapter => chapter.title === "Context");
        const messageChapter = chapters.find(chapter => chapter.title === "Messages");
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
        await Document.updateParagraph(messageChapter.id, messageId, message.text, message.commands, message.comments);

        return await Document.createParagraph(contextChapter.id, message.text, {
            replay: {
                role: "assistant",
                isContextFor: message.id
            }
        }, {});
    }
    self.removeMessageFromContext = async function (chatId, messageId) {
        const chat = await Document.getDocument(chatId);
        const contextChapter = chat.chapters.find(chapter => chapter.title === "Context");
        const messageChapter = chat.chapters.find(chapter => chapter.title === "Messages");
        if (!contextChapter) {
            throw new Error("Context chapter not found");
        }
        if (!messageChapter) {
            throw new Error("Messages chapter not found");
        }
        const contextMessage = contextChapter.paragraphs.find(paragraph => paragraph.id === messageId);
        const referenceMessage = messageChapter.paragraphs.find(paragraph => paragraph.id === contextMessage.commands.replay.isContextFor);

        referenceMessage.commands.replay.isContext = false;
        await Document.updateParagraph(messageChapter.id, referenceMessage.id, referenceMessage.text, referenceMessage.commands, referenceMessage.comments);

        return await Document.deleteParagraph(contextChapter.id, messageId);
    }
    self.updateChatContextItem = async function (chatId, contextItemId, newText) {
        const chat = await Document.getDocument(chatId);
        const contextChapter = chat.chapters.find(chapter => chapter.title === "Context");
        if (!contextChapter) {
            throw new Error("Context chapter not found");
        }
        const contextItem = contextChapter.paragraphs.find(paragraph => paragraph.id === contextItemId);
        if (!contextItem) {
            throw new Error("Context item not found");
        }
        return await Document.updateParagraph(contextChapter.id, contextItemId, newText, contextItem.commands, contextItem.comments);
    }

    self.sendMessage = async function (chatId, userId, message, role) {
        const chat = await Document.getDocument(chatId);
        let chapterId;
        if (chat.chapters.length === 0) {
            [chapterId] = await Promise.all([
                    Document.createChapter(chatId, "Messages", {}, [], 0),
                    Document.createChapter(chatId, "Context", {}, [], 1)
                ]
            )
        } else {
            const chapters = await Promise.all(chat.chapters.map(chapter => Document.getChapter(chapter)));
            chapterId = chapters.find(chapter => chapter.title === "Messages")?.id;
        }
        if (!chapterId) {
            throw new Error("Messages chapter not found");
        }

        return await Document.createParagraph(chapterId, message, {replay: {role, name: userId}}, {});
    }

    self.sendQuery = async function (chatId, personalityId, userId, userPrompt) {


    }
    self.sendStreamingQuery = async function (chatId, personalityId, userId, userPrompt) {
        return self.sendQuery(chatId, personalityId, userId, userPrompt);
    }

    return self;
}

let singletonInstance;

module.exports = {
    getInstance: async function () {
        if (!singletonInstance) {
            singletonInstance = await Chat();
        }
        return singletonInstance;
    },
    getAllow: function () {
        return async function (globalUserId, email, command, ...args) {
            return true;
        }
    },
    getDependencies: function () {
        return ["Documents"];
    }
}