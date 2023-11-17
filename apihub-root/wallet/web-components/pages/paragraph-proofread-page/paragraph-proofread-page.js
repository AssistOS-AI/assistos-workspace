import {SaveElementTimer, sanitize, parseURL} from "../../../imports.js";

export class paragraphProofreadPage {
    constructor(element, invalidate) {
        this.element=element;
        let documentId, chapterId, paragraphId;
        [documentId, chapterId, paragraphId] = parseURL();
        this._document = webSkel.currentUser.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this._paragraph = this._chapter.getParagraph(paragraphId);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.chapterNr = this._document.chapters.findIndex(chapter => chapter.id === this._chapter.id) + 1;
        this.paragraphNr = this._chapter.paragraphs.findIndex(paragraph => paragraph.id === this._paragraph.id) + 1;
        this.paragraphText = this._paragraph.text;
    }
    afterRender(){
        if(this.improvedParagraph){
            let improvedParagraphSection = this.element.querySelector(".improved-paragraph-container");
            improvedParagraphSection.style.display = "block";
        }
    }

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }
    async openChapterBrainstormingPage() {
        await webSkel.changeToDynamicPage("chapter-brainstorming-page", `documents/${this._document.id}/chapter-brainstorming-page/${this._chapter.id}`);
    }

    async openParagraphBrainstormingPage() {
        await webSkel.changeToDynamicPage("paragraph-brainstorming-page", `documents/${this._document.id}/paragraph-brainstorming-page/${this._chapter.id}/${this._paragraph.id}`);
    }

    async suggestImprovements(_target){
        let flowId = webSkel.currentUser.space.getFlowIdByName("proofread");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, this.paragraphText);
        this.improvedParagraph = result.responseString || result.responseJson;
        this.invalidate();
    }

    editCurrentParagraph(){
        let paragraph = this.element.querySelector(".paragraph-content");
        if (paragraph.getAttribute("contenteditable") === "false") {
            paragraph.setAttribute("contenteditable", "true");
            paragraph.focus();
            let timer = new SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = sanitize(paragraph.innerText);
                if (sanitizedText !== this._paragraph.text && !confirmationPopup) {
                    await this._document.updateParagraphText(this._paragraph, sanitizedText);
                    paragraph.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${paragraph.offsetWidth/2}"></confirmation-popup>`);
                }
            }, 1000);
            paragraph.addEventListener("blur", async () => {
                paragraph.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                paragraph.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            paragraph.addEventListener("keydown", resetTimer);
        }
    }
    async enterEditMode(_target) {
        let confirmationPopup = this.element.querySelector("confirmation-popup");
        if(confirmationPopup){
            confirmationPopup.remove();
        }
        let paragraph = this.element.querySelector(".improved-paragraph");
        const controller = new AbortController();
        document.addEventListener("click", this.exitEditMode.bind(this, paragraph, controller), {signal:controller.signal});
        paragraph.setAttribute("contenteditable", "true");
        paragraph.focus();
    }

    async exitEditMode (paragraph, controller, event) {
        if (paragraph.getAttribute("contenteditable") === "true" && paragraph !== event.target && !paragraph.contains(event.target)) {
            paragraph.setAttribute("contenteditable", "false");
            this.improvedParagraph = paragraph.innerText;
            controller.abort();
        }
    }


    async acceptImprovements(_target) {
        let paragraph = this.element.querySelector(".improved-paragraph").innerText;
        if(paragraph !== this._paragraph.text) {
            await this._document.updateParagraphText(this._paragraph, paragraph);
            this.invalidate();
        }
    }
}

