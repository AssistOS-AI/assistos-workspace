const {addChatToPersonality} = require('../spaces-storage/space.js').APIs
const Document = require('../document/services/document.js')
const Chapter = require('../document/services/chapter.js')
const Paragraph = require('../document/services/paragraph.js')

const getChat = async function (spaceId, documentId) {
    return await Document.getDocument(spaceId, documentId)
}

const createChat = async function (spaceId, personalityId) {
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

    await addChatToPersonality(spaceId, personalityId, chatId);

    return chatId;
}

const watchChat = async function () {

}

const sendMessage = async function (spaceId, chatId, userId, message) {
    const chat = await Document.getDocument(spaceId, chatId);
    const messagesId = chat.chapters[0].id;
    const paragraphData = {
        text: message,
        commands: {
            replay: {
                role: "own",
                name: userId
            }
        }
    }
    return await Paragraph.createParagraph(spaceId, chatId, messagesId, paragraphData);
}

const sendQuery = async function () {

}

const resetChat = async function (spaceId, chatId) {
    const chat = await Document.getDocument(spaceId, chatId);
    const messagesChapter = chat.chapters[0];
    const contextChapter = chat.chapters[1];
    await Promise.all(
        [messagesChapter.paragraphs.map(paragraph => {
            return Paragraph.deleteParagraph(spaceId, chatId, messagesChapter.id, paragraph.id)
        }),
            contextChapter.paragraphs.map(paragraph => {
                return Paragraph.deleteParagraph(spaceId, chatId, contextChapter.id, paragraph.id)
            })
        ].flat()
    );
    return chatId;
}

module.exports = {
    getChat, createChat, watchChat, sendMessage, sendQuery, resetChat
}