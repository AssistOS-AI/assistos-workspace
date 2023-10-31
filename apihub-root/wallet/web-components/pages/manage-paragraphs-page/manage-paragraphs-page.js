import {
    reverseQuerySelector,
    showActionBox
} from "../../../imports.js";

export class manageParagraphsPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this._chapter = this._document.getChapter(webSkel.space.currentChapterId);
        this.invalidate = invalidate;
        this.invalidate();
        this.mainIdeas = this._chapter.getMainIdeas();
    }

    beforeRender() {
        this.chapterNr = this._document.chapters.findIndex(chapter => chapter.id === this._chapter.id) + 1;
        this.chapterMainIdeas = "";
        for(let idea of this.mainIdeas){
            this.chapterMainIdeas += `<li>${idea}</li>`;
        }

        this.paragraphs= "";
        let number = 0;
        this._chapter.paragraphs.forEach((item) => {
            number++;
            this.paragraphs += `<reduced-paragraph-unit data-id="${item.id}" data-local-action="editAction"
            data-nr="${number}" data-text="${item.text}"></reduced-paragraph-unit>`;
        });
        document.removeEventListener("click", this.exitEditMode, true);
    }

    afterRender(){
        let mainIdeas = this.element.querySelector(".main-ideas-list");
        const maxLength = 80;
        mainIdeas.addEventListener("input", function (event) {
            for(let child of event.target.children){
                if(child.innerHTML === "<br>"){
                    child.innerHTML = "";
                }
                if (child.innerText.length > maxLength) {
                    const selection = window.getSelection();
                    const range = document.createRange();

                    // Truncate the text and update the element
                    child.innerText = child.innerText.substring(0, maxLength);

                    // Restore the cursor position to the end of the text
                    range.setStart(child.firstChild, child.innerText.length);
                    range.setEnd(child.firstChild, child.innerText.length);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        });
    }
    async enterEditMode(_target) {
        let mainIdeas = this.element.querySelector(".main-ideas-list");
        const controller = new AbortController();
        document.addEventListener("click", this.exitEditMode.bind(this, mainIdeas, controller), {signal:controller.signal});
        mainIdeas.setAttribute("contenteditable", "true");
        mainIdeas.focus();
    }

    async exitEditMode (mainIdeas, controller, event) {
        if (mainIdeas.getAttribute("contenteditable") === "true" && mainIdeas !== event.target && !mainIdeas.contains(event.target)) {
            mainIdeas.setAttribute("contenteditable", "false");
            let ideas = mainIdeas.innerText.split("\n");
            await this._document.setChapterMainIdeas(this._chapter, ideas);
            mainIdeas.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
            data-message="Saved!" data-left="${mainIdeas.offsetWidth/2}"></confirmation-popup>`);
            controller.abort();
        }
    }
    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }
    async addParagraph(){
        let paragraphObj={
            text: "Edit here your first paragraph."
        }
        await this._document.addParagraph(this._chapter, paragraphObj);
        this.invalidate();
    }
    async summarize(){
        let scriptId = webSkel.space.getScriptIdByName("summarize");
        let result = await webSkel.getService("LlmsService").callScript(scriptId, this._chapter.stringifyChapter());
        this.mainIdeas = result.responseJson;

        await this._document.setMainIdeas(result.responseJson);
        this.invalidate();
    }

    async generateParagraphs(){
        await webSkel.changeToDynamicPage("generate-paragraphs-page", `documents/${this._document.id}/generate-paragraphs-page/${this._chapter.id}`);
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async editAction(_target){
        let paragraph = reverseQuerySelector(_target, "reduced-paragraph-unit");
        let paragraphId = paragraph.getAttribute("data-id");
        await webSkel.changeToDynamicPage("paragraph-brainstorming-page",
            `documents/${this._document.id}/paragraph-brainstorming-page/${this._chapter.id}/${paragraphId}`);
    }
    async deleteAction(_target){
        let paragraph = reverseQuerySelector(_target, "reduced-paragraph-unit");
        let paragraphId = paragraph.getAttribute("data-id");
        await this._document.deleteParagraph(this._chapter, paragraphId);
        this.invalidate();
    }
}