export class Document {
    constructor(documentTitle) {
        this.name = documentTitle;
        this.abstract = "";
        this.chapters = [];
    }
    /* TBD if we let the functions here or move to the chapter/paragraph classes */
    observeParagraph(chapterNumber, paragraphNumber){}
    changeChapterOrder(chapterSrc,chapterTarget){}
    changeParagraphOrder(paraSrc,paraTarget){}
    setDocSettings(){}
    getDocSettings(){}
    insetChapter(){}
    insertParagraph(){}
    getChapter(){}
    updateChapter(){}
    getParagraph(){}
    updateParagraph(){}
}