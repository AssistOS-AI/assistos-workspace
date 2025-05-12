export class DocumentItem{
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.element = element;
        this.invalidate();
        this.id = this.element.getAttribute('data-id');
        let documentsPresenter = this.element.closest('documents-page').webSkelPresenter;
        this.document = documentsPresenter.documents.find((document) => document.id === this.id);
    }
    beforeRender() {
        this.title = this.document.title;
        this.chaptersCount = this.document.chapters.length;
        this.infoText = this.document.infoText;
    }
}