const lightDB = require('../../apihub-component-utils/lightDB.js');

class ParagraphService {
    constructor() {
        if (ParagraphService.instance) {
            return ParagraphService.instance
        }
        ParagraphService.instance = this;
    }

    constructParagraphURI(documentId, paragraphId,property) {
        return `${documentId}/${paragraphId}${property ? `/${property}` : ''}`
    }

    async deleteParagraph(spaceId, documentId,chapterId, paragraphId) {
        return await lightDB.deleteEmbeddedObject(spaceId,this.constructParagraphURI(documentId, paragraphId))
    }

    async getParagraph(spaceId, documentId,chapterId, paragraphId) {
        return await lightDB.getEmbeddedObject(spaceId, documentId, this.constructParagraphURI(documentId, paragraphId))
    }

    async createParagraph(spaceId,documentId,chapterId,paragraphData) {
        return await lightDB.addEmbeddedObject(spaceId, "paragraph", this.constructParagraphURI(documentId, chapterId), paragraphData)
    }

    async updateParagraph(spaceId, documentId,chapterId, paragraphId, paragraphData) {
        return await lightDB.updateEmbeddedObject(spaceId, this.constructParagraphURI(documentId, paragraphId), paragraphData)
    }
}

module.exports = new ParagraphService()
