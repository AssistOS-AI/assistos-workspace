const lightDB = require('../../apihub-component-utils/lightDB.js');

class ChapterService {
    constructor() {
        if (ChapterService.instance) {
            return ChapterService.instance
        }
        ChapterService.instance = this;
    }

    constructChapterURI(documentId, chapterId, property) {
        return `${documentId}/${chapterId}${property ? `/${property}` : ''}`
    }

    async deleteChapter(spaceId, documentId, chapterId) {
        return await lightDB.deleteEmbeddedObject(spaceId, this.constructChapterURI(documentId, chapterId))
    }

    async getChapter(spaceId, documentId, chapterId,queryParams) {
        if (Object.keys(queryParams).length === 0) {
            return await lightDB.getEmbeddedObject(spaceId, "chapters", this.constructChapterURI(documentId, chapterId))
        }
        if (queryParams.fields) {
            if (Array.isArray(queryParams.fields)) {
                let chapterSegments = {}
                for (const field of queryParams.fields) {
                    chapterSegments[field] = await lightDB.getEmbeddedObject(spaceId, "chapters", this.constructChapterURI(documentId,chapterId,field))
                }
                return chapterSegments
            } else {
                return await lightDB.getEmbeddedObject(spaceId,"chapters", this.constructChapterURI(documentId,chapterId,queryParams.fields))
            }
        }
    }

    async createChapter(spaceId, documentId, chapterData) {
        return await lightDB.addEmbeddedObject(spaceId, "chapters", this.constructChapterURI(documentId, "chapters"), chapterData)
    }

    async updateChapter(spaceId, documentId, chapterId, chapterData, queryParams, sessionId) {
        if (Object.keys(queryParams).length === 0) {
            return await lightDB.updateEmbeddedObject(spaceId, this.constructChapterURI(documentId, chapterId), chapterData, sessionId)
        }
        if (queryParams.fields) {
            if (Array.isArray(queryParams.fields)) {
                for (const field of queryParams.fields) {
                    await lightDB.updateEmbeddedObject(spaceId, this.constructChapterURI(documentId,chapterId, field), chapterData[field])
                }
            } else {
                return await lightDB.updateEmbeddedObject(spaceId, this.constructChapterURI(documentId,chapterId,queryParams.fields), chapterData)
            }
        }
    }
}

module.exports = new ChapterService()
