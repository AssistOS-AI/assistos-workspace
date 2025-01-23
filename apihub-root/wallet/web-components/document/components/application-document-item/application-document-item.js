export class   ApplicationDocumentItem{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    async beforeRender() {

    }
    async afterRender() {

    }
    async openDocument(_target) {
        let documentId = this.element.getAttribute("data-id");
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/document-view-page/${documentId}`);
    }
}