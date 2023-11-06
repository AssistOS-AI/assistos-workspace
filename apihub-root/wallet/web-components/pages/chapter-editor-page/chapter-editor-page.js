import {
    parseURL,
    reverseQuerySelector, SaveElementTimer,
    showActionBox
} from "../../../imports.js";
export class chapterEditorPage{
    constructor(element, invalidate) {
        this.element = element;
        let documentId, chapterId;
        [documentId, chapterId] = parseURL();
        this._document = webSkel.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.chapterTitle= this._chapter.title;
        this.chapterNr = this._document.chapters.findIndex(chapter => chapter.id === this._chapter.id) + 1;
        this.chapterContent=`<chapter-editor-unit data-chapter-number="${this.chapterNr }" data-chapter-title="${this._chapter.title}" data-chapter-id="${this._chapter.id}" data-presenter="chapter-editor-unit"></chapter-editor-unit>`;
    }

    afterRender(){

    }
    async addParagraph(){
        let paragraphObj={
            text: "Edit here your first paragraph."
        }
        await this._document.addParagraph(this._chapter, paragraphObj);
        this.invalidate();
    }
    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async openChapterEditPage(){
        await webSkel.changeToDynamicPage("chapter-edit-page", `documents/${this._document.id}/chapter-edit-page/${this._chapter.id}`);
    }
    async openChapterEditor(){
        await webSkel.changeToDynamicPage("chapter-editor-page", `documents/${this._document.id}/chapter-editor-page/${webSkel.space.currentChapterId}`);
    }
    async openEditChapterTitlePage() {
        await webSkel.changeToDynamicPage("chapter-title-page",
            `documents/${this._document.id}/chapter-title-page/${webSkel.space.currentChapterId}`);
    }
    async openChapterBrainstormingPage() {
        await webSkel.changeToDynamicPage("chapter-brainstorming-page",
            `documents/${this._document.id}/chapter-brainstorming-page/${webSkel.space.currentChapterId}`);

    }
    async openManageParagraphsPage() {
        await webSkel.changeToDynamicPage("manage-paragraphs-page",
            `documents/${this._document.id}/manage-paragraphs-page/${webSkel.space.currentChapterId}`);
    }
    async generateParagraphs(){
        await webSkel.changeToDynamicPage("generate-paragraphs-page", `documents/${this._document.id}/generate-paragraphs-page/${this._chapter.id}`);
    }
}