const lightDB = require('../../apihub-component-utils/lightDB.js');

class ChapterService {
    constructor() {
        if(ChapterService.instance){
            return ChapterService.instance
        }
        ChapterService.instance=this;
    }
    constructChapterURI(documentId, chapterId,property) {
        return `${documentId}/${chapterId}${property ? `/${property}` : ''}`
    }
    async deleteChapter(spaceId, documentId, chapterId) {
        return await lightDB.deleteEmbeddedObject(spaceId,this.constructChapterURI(documentId, chapterId))
    }

    async getChapter(spaceId,documentId,chapterId) {
        return await lightDB.getEmbeddedObject(spaceId,"chapters",this.constructChapterURI(documentId, chapterId))
    }

    async createChapter(spaceId,documentId,chapterData) {
       return await lightDB.addEmbeddedObject(spaceId,"chapters",this.constructChapterURI(documentId, "chapters"),chapterData)
    }

    async updateChapter(spaceId,documentId,chapterId,chapterData) {
        return await lightDB.updateEmbeddedObject()
    }
}

module.exports = new ChapterService()
