const {addChatToPersonality,getPersonalityData} = require('../spaces-storage/space.js').APIs
const Document = require('../document/services/document.js')
const Chapter = require('../document/services/chapter.js')
const Paragraph = require('../document/services/paragraph.js')

const {getTextStreamingResponse} = require('../llms/controller.js');

const getChatMessages = async function (spaceId, chatId) {
    const chat = await Document.getDocument(spaceId, chatId);
    return chat.chapters[0].paragraphs;
}
const getChatContext = async function (spaceId, chatId) {
    const chat = await Document.getDocument(spaceId, chatId);
    return chat.chapters[1].paragraphs;
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

const sendMessage = async function (spaceId, chatId, userId, message, role) {
    const chat = await Document.getDocument(spaceId, chatId);
    let chapterId;
    if (chat.chapters.length === 0) {
        const chatChapterData = {
            title: `Chat Messages`,
            paragraphs: []
        }
        chapterId = await Chapter.createChapter(spaceId, chatId, chatChapterData);
    } else {
        chapterId = chat.chapters[0].id;
    }

    const paragraphData = {
        text: message,
        commands: {
            replay: {
                role,
                name: userId
            }
        }
    }
    return (await Paragraph.createParagraph(spaceId, chatId, chapterId, paragraphData)).id;
}

const sendQuery = async function (request, response, spaceId, chatId, personalityId,userId,context, prompt) {
    function unsanitize(value) {
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

    const applyChatPrompt = (chatPrompt,context,prompt)=>
`${chatPrompt}
**Conversation**
${context.length > 0 ? context.map(({role, message}) => `${role} : ${message}`).join('\n') : '""'}
**Respond to this request**:
${prompt}
`;
    const personalityData = await getPersonalityData(spaceId, personalityId);
    let {chatPrompt} = personalityData;
    chatPrompt = unsanitize(chatPrompt);
    let unsPrompt = unsanitize(prompt);

    request.body.prompt = applyChatPrompt(chatPrompt,context,unsPrompt);
    request.body.modelName = personalityData.llms.text;

    await sendMessage(spaceId, chatId, userId, prompt, "user");

    let messageId = null;
    let isFirstChunk = true;
    let streamClosed = false;

    const updateQueue = [];
    let isProcessingQueue = false;

    response.on('close', async () => {
        if (!streamClosed) {
            streamClosed = true;
            updateQueue.length = 0;
        }
    });

    const processQueue = async () => {
        if (isProcessingQueue || streamClosed) return;
        isProcessingQueue = true;

        while (updateQueue.length > 0 && !streamClosed) {
            const currentChunk = updateQueue.shift();
            await updateMessage(
                spaceId,
                chatId,
                messageId,
                currentChunk
            );
        }
        isProcessingQueue = false;
    };

    const streamContext = await getTextStreamingResponse(
        request,
        response,
        async (chunk) => {
            try {
                if (streamClosed) return;
                if (isFirstChunk) {
                    isFirstChunk = false;
                    messageId = await sendMessage(spaceId, chatId, personalityId, chunk, "assistant");
                } else {
                    if (!messageId) return;
                    updateQueue.push(chunk);
                    await processQueue();
                }
            } catch (error) {

            }
        }
    );
    await streamContext.streamPromise;
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
const resetChatContext = async function (spaceId, chatId) {
    const chat = await Document.getDocument(spaceId, chatId);
    const contextChapter = chat.chapters[1];
    await Promise.all(
        contextChapter.paragraphs.map(paragraph => {
            return Paragraph.deleteParagraph(spaceId, chatId, contextChapter.id, paragraph.id)
        })
    );
    return chatId;
}

const updateMessage = async function (spaceId, chatId, messageId, message) {
    await Paragraph.updateParagraph(spaceId, chatId, messageId, message, {fields: "text"});
}

const addMessageToContext = async function(spaceId,chatId,messageId){
    const chat = await Document.getDocument(spaceId, chatId);
    let contextChapterId= chat.chapters[1].id;
    const paragraphData= {
        text:messageId,
        commands:{}
    }
    return (await Paragraph.createParagraph(spaceId, chatId, contextChapterId, paragraphData)).id;
}

module.exports = {
    getChatMessages, createChat, watchChat, sendMessage, sendQuery, resetChat, updateMessage, resetChatContext,addMessageToContext,
    getChatContext
}