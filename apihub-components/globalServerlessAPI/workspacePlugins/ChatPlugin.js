const Document = require("../../document/services/document");
const Chapter = require("../../document/services/chapter");
async function SpaceInstancePersistence(){

    let self = {};
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
        return ["DefaultPersistence"];
    }
}