import {Paragraph, showActionBox, reverseQuerySelector} from "../../../imports.js";
export class manageChaptersPage {
    constructor(element, invalidate) {
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        if(!this._document.getMainIdeas() || this._document.getMainIdeas().length === 0) {
            this.summarizeButtonName = "Summarize";
        } else {
            this.summarizeButtonName = "Recreate Summary";
        }
        this.chaptersDiv= "";
        let number = 0;
        this._document.chapters.forEach((item) => {
            number++;
            this.chaptersDiv += `<reduced-chapter-unit nr="${number}" title="${item.title}" data-id="${item.id}"></reduced-chapter-unit>`;
        });
    }

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }
    async addChapter(){
        let chapterObj={
            title: "New chapter",
            id: webSkel.getService("UtilsService").generateId(),
            paragraphs: [new Paragraph({id: webSkel.getService("UtilsService").generateId(), text: "Edit here your first paragraph."})]
        }
        await this._document.addChapter(chapterObj);
        this.invalidate();
    }

    summarize(){
        this.docMainIdeas = ". idea 1 this is a very good idea yeas " +
            ". idea 2 this is another good one yes yes idea";
        this.invalidate();
    }

    generateChapter(){
        alert("generate chapter not done yet");
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async editAction(_target){
        let chapter = reverseQuerySelector(_target, "reduced-chapter-unit");
        let chapterId = chapter.getAttribute("data-id");
        await webSkel.changeToDynamicPage("manage-paragraphs-page",
            `documents/${this._document.id}/manage-paragraphs-page/${chapterId}`);
    }
    async deleteAction(_target){
        let chapter = reverseQuerySelector(_target, "reduced-chapter-unit");
        let chapterId = chapter.getAttribute("data-id");
        await this._document.deleteChapter(chapterId);
        this.invalidate();
    }
}