export class paragraphProofreadPage {
    constructor(element, invalidate) {
        this.element=element;
        let documentId, chapterId, paragraphId;
        [documentId, chapterId, paragraphId] = webSkel.getService("UtilsService").parseURL();
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
        if(!this.personality){
            this.selectedPersonality = `<option value="" disabled selected hidden>Select personality</option>`;
        }else {
            this.selectedPersonality = `<option value="${this.personality.id}" selected>${this.personality.name}</option>`
        }
        let stringHTML = "";
        for(let personality of webSkel.currentUser.space.personalities){
            stringHTML+=`<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
    }
    afterRender(){
        if(this.improvedParagraph){
            let improvedParagraphSection = this.element.querySelector(".improved-paragraph-container");
            improvedParagraphSection.style.display = "block";
        }
        let detailsElement = this.element.querySelector("#details");
        if(this.details){
            detailsElement.value = this.details;
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

    async executeProofRead() {
        let form = this.element.querySelector(".proofread-form");
        const formData = await webSkel.UtilsService.extractFormInformation(form);

        this.text = formData.data.text;
        if(formData.data.personality){
            this.personality = webSkel.currentUser.space.getPersonality(formData.data.personality);
        }
        this.details = formData.data.details;
        let flowId = webSkel.currentUser.space.getFlowIdByName("Proofread");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, this.paragraphText, formData.data.personality, this.details);
        this.observations = webSkel.UtilsService.sanitize(result.responseJson.observations);
        this.improvedParagraph = webSkel.UtilsService.sanitize(result.responseJson.improvedText);
        this.invalidate();
    }

    editCurrentParagraph(){
        let paragraph = this.element.querySelector(".paragraph-content");
        if (paragraph.getAttribute("contenteditable") === "false") {
            paragraph.setAttribute("contenteditable", "true");
            paragraph.focus();
            let timer = new webSkel.getService("UtilsService").SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = webSkel.UtilsService.sanitize(paragraph.innerText);
                if (sanitizedText !== this._paragraph.text && !confirmationPopup) {
                    let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateParagraphText");
                    await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, this._paragraph.id, sanitizedText);
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
            let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateParagraphText");
            await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, this._paragraph.id, paragraph);
            this.invalidate();
        }
    }
}

