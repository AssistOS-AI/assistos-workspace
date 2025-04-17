export class TableEditor{
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.element = element;
        this.documentId = this.element.getAttribute("data-document-id");
        this.chapterId = this.element.getAttribute("data-chapter-id");
        this.paragraphId = this.element.getAttribute("data-paragraph-id");
        this.documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this.document = this.documentPresenter._document;
        if(this.chapterId){
            this.chapter = this.document.chapters.find(chapter => chapter.id === this.chapterId);
        }
        if(this.paragraphId){
            this.paragraph = this.chapter.paragraphs.find(paragraph => paragraph.id === this.paragraphId);
        }
        this.element.classList.add("maintain-focus");
        let varName = this.element.getAttribute("data-var-name");
        let variable = this.documentPresenter.variables.find(variable => variable.varName === varName);
        this.invalidate();
    }
    beforeRender(){

    }
}