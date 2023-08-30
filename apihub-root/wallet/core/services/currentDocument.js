export class CurrentDocument{
    constructor(document){
        if (CurrentDocument.instance) {
            return CurrentDocument.instance;
        }
        this.document=document?document:{};
        CurrentDocument.instance = this;
    }
    static getInstance(document) {
        if(!this.instance) {
            this.instance = new CurrentDocument(document);
        }
        return this.instance;
    }
    observeParagraph(chapterNumber, paragraphNumber){}
    changeChapterOrder(chapterSrc,chapterTarget){

    }
    changeParagraphOrder(paraSrc,paraTarget){

    }
    setDocSettings(){}
    getDocSettings(){}
    insetChapter(){}
    insertParagraph(){}
    getChapter(){}
    updateChapter(){}
    getParagraph(){}
    updateParagraph(){}
}