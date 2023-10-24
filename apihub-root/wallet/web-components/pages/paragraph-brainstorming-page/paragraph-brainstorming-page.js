import {reverseQuerySelector, showActionBox, showModal} from "../../../imports.js";

export class paragraphBrainstormingPage {
    constructor(element, invalidate) {
        this.element = element;
        let url = window.location.hash;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this._chapter = this._document.getChapter(webSkel.space.currentChapterId);
        this._paragraph = this._chapter.getParagraph(url.split("/")[4]);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.invalidate();
        this.paragraphMainIdea = this._paragraph.getMainIdea();
    }

    beforeRender() {
        this.chapterNr = this._document.chapters.findIndex(chapter => chapter.id === this._chapter.id) + 1;
        this.paragraphNr = this._chapter.paragraphs.findIndex(paragraph => paragraph.id === this._paragraph.id) + 1;


        this.alternativeParagraphs= "";
        let number = 0;
        this._paragraph.alternativeParagraphs.forEach((item) => {
            number++;
            this.alternativeParagraphs += `<alternative-paragraph data-id="${item.id}" data-local-action="edit"
            data-nr="${number}" data-text="${item.text}"></alternative-paragraph>`;
        });
        document.removeEventListener("click", this.exitEditMode, true);
    }

    async enterEditMode(_target, itemName) {
        let item;
        if(itemName === "mainIdea"){
            item = this.element.querySelector(".main-idea-content");
        }else {
            item = this.element.querySelector(".paragraph-content");
        }
        if(!item.hasAttribute("contenteditable")){
            document.addEventListener("click", this.exitEditMode.bind(this, item, itemName), true);
        }
        item.setAttribute("contenteditable", "true");
        item.focus();
    }

    async exitEditMode (item, itemName, event) {
        if (item.getAttribute("contenteditable") && !item.contains(event.target)) {
            item.setAttribute("contenteditable", "false");
            let text = item.innerText;
            if(itemName === "mainIdea"){
                await this._document.setParagraphMainIdea(this._paragraph, text);
            }else {
                await this._document.updateParagraph(this._paragraph, text);
            }
        }
    }

    async suggestParagraph(){
        await showModal(document.querySelector("body"), "suggest-paragraph-modal", { presenter: "suggest-paragraph-modal"});
    }

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async summarize(){
        const loading = await webSkel.showLoading();
        let scriptId = webSkel.space.getScriptIdByName("summarize");
        let result = await webSkel.getService("LlmsService").callScript(scriptId, this._chapter.stringifyChapter());
        this.mainIdeas = result.responseJson;

        await this._document.setMainIdeas(result.responseJson);
        loading.close();
        loading.remove();
        this.invalidate();
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async edit(_target){
        let paragraph = reverseQuerySelector(_target, "reduced-paragraph-unit");
        let paragraphId = paragraph.getAttribute("data-id");
        await webSkel.changeToDynamicPage("paragraph-brainstorming-page",
            `documents/${this._document.id}/paragraph-brainstorming-page/${this._chapter.id}/${paragraphId}`);
    }
    async delete(_target){
        let paragraph = reverseQuerySelector(_target, "reduced-paragraph-unit");
        let paragraphId = paragraph.getAttribute("data-id");
        await this._document.deleteParagraph(this._chapter, paragraphId);
        this.invalidate();
    }

    async select(_target){

    }
}