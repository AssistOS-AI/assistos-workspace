import {
    reverseQuerySelector,
    showActionBox,
    showModal,
    removeActionBox
} from "../../../imports.js";

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
    }

    beforeRender() {
        this.chapterNr = this._document.chapters.findIndex(chapter => chapter.id === this._chapter.id) + 1;
        this.paragraphNr = this._chapter.paragraphs.findIndex(paragraph => paragraph.id === this._paragraph.id) + 1;
        this.paragraphText = this._paragraph.text;
        this.paragraphMainIdea = this._paragraph.getMainIdea();

        this.alternativeParagraphs= "";
        let number = 0;
        this._paragraph.alternativeParagraphs.forEach((item) => {
            number++;
            this.alternativeParagraphs += `<alternative-paragraph data-id="${item.id}" data-local-action="edit querySelect"
            data-nr="${number}" data-text="${item.text}"></alternative-paragraph>`;
        });
        document.removeEventListener("click", this.exitEditMode, true);
    }

    limitMainIdeaText(event){
        let maxLength = 80;
        if (event.target.innerText.length > maxLength) {
            const selection = window.getSelection();
            const range = document.createRange();

            // Truncate the text and update the element
            event.target.innerText = event.target.innerText.substring(0, maxLength);

            // Restore the cursor position to the end of the text
            range.setStart(event.target.firstChild, event.target.innerText.length);
            range.setEnd(event.target.firstChild, event.target.innerText.length);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    async enterEditMode(_target, itemName) {
        let item;
        if(itemName === "mainIdea"){
            item = this.element.querySelector(".main-idea-content");
            item.addEventListener("input", this.limitMainIdeaText);
        }else {
            item = this.element.querySelector(".paragraph-content");
        }
        const controller = new AbortController();
        document.addEventListener("click", this.exitEditMode.bind(this, item, itemName, controller), {signal:controller.signal});
        item.setAttribute("contenteditable", "true");
        item.focus();
    }

    async exitEditMode (item, itemName, controller, event) {
        if (item.getAttribute("contenteditable") === "true" && item !== event.target && !item.contains(event.target)) {
            item.setAttribute("contenteditable", "false");
            let text = item.innerText;
            if(itemName === "mainIdea"){
                item.removeEventListener("input",this.limitMainIdeaText);
                await this._document.setParagraphMainIdea(this._paragraph, text);
            }else {
                await this._document.updateParagraphText(this._paragraph, text);
            }
            item.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
            data-message="Saved!" data-left="${item.offsetWidth/2}"></confirmation-popup>`);
            controller.abort();
        }
    }

    async suggestParagraph(){
        await showModal(document.querySelector("body"), "suggest-paragraph-modal", { presenter: "suggest-paragraph-modal"});
    }

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async openChapterBrainStormingPage(){
        await webSkel.changeToDynamicPage("chapter-brainstorming-page", `documents/${this._document.id}/chapter-brainstorming-page/${this._chapter.id}`);
    }

    async openParagraphProofreadPage(){
        await webSkel.changeToDynamicPage("paragraph-proofread-page", `documents/${this._document.id}/paragraph-proofread-page/${this._chapter.id}/${this._paragraph.id}`);
    }

    async summarize(){
        let scriptId = webSkel.space.getScriptIdByName("summarize");
        let result = await webSkel.getService("LlmsService").callScript(scriptId, this._paragraph.toString());
        this.paragraphMainIdea = result.responseJson[0];
        await this._document.setParagraphMainIdea(this._paragraph, result.responseJson);
        this.invalidate();
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async edit(_target, querySelect){
        let paragraph;
        if(querySelect){
            paragraph = _target.querySelector(".content");
        }else {
            paragraph = reverseQuerySelector(_target, ".content");
        }
        let paragraphComponent = reverseQuerySelector(_target, "alternative-paragraph");
        let paragraphId = paragraphComponent.getAttribute("data-id");
        let alternativeParagraph = this._paragraph.getAlternativeParagraph(paragraphId);
        if(this.actionBox){
            removeActionBox(this.actionBox, this);
        }
        paragraph.contentEditable = true;
        paragraph.focus();
        paragraph.addEventListener('blur', async () => {
            paragraph.contentEditable = false;
            if(paragraph.innerText !== alternativeParagraph.text) {
               await this._document.updateAlternativeParagraph(this._paragraph, paragraphId, paragraph.innerText);
            }
            paragraph.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                data-message="Saved!" data-left="${paragraph.offsetWidth/2}"></confirmation-popup>`);
        }, {once:true});
    }
    async delete(_target){
        let paragraph = reverseQuerySelector(_target, "alternative-paragraph");
        let paragraphId = paragraph.getAttribute("data-id");
        await this._document.deleteAlternativeParagraph(this._paragraph, paragraphId);
        this.invalidate();
    }

    async select(_target){
        let paragraphElement = reverseQuerySelector(_target,"alternative-paragraph");
        let paragraphId = paragraphElement.getAttribute("data-id");
        let paragraphObj = this._paragraph.getAlternativeParagraph(paragraphId);
        if(paragraphObj.text !== this._paragraph.text ||  paragraphObj.text!==this._paragraph.getMainIdea() ) {
            await this._document.updateParagraph(this._paragraph, paragraphObj);
            this.invalidate();
        } else {
            removeActionBox(this.actionBox, this);
        }
    }
}