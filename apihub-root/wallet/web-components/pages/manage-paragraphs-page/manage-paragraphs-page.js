import {
    parseURL,
    reverseQuerySelector, SaveElementTimer,
    showActionBox, showModal
} from "../../../imports.js";

export class manageParagraphsPage {
    constructor(element, invalidate) {
        this.element = element;
        let documentId, chapterId;
        [documentId, chapterId] = parseURL();
        this._document = webSkel.currentUser.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this._document.observeChange(this._document.getNotificationId() + ":manage-paragraphs-page", invalidate);
        this.invalidate = invalidate;
        this.invalidate();

    }

    beforeRender() {
        this.chapterNr = this._document.chapters.findIndex(chapter => chapter.id === this._chapter.id) + 1;
        this.chapterMainIdeas = "";
        this.mainIdeas = this._chapter.getMainIdeas();
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
    }

    afterRender(){
        let mainIdeas = this.element.querySelector(".main-ideas-list");
        mainIdeas.removeEventListener("input", this.manageList);
        mainIdeas.addEventListener("input", this.manageList);
    }

    manageList(event){
        const maxLength = 80;
        for(let child of event.target.children){
            if(event.target.children.length === 1 && event.target.firstChild.innerText === ""){
                event.target.firstChild.textContent = `<li>${event.target.firstChild.innerText}</li>`;
            }
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
    }
    async editMainIdeas(_target) {
        let mainIdeas = this.element.querySelector(".main-ideas-list");
        if (mainIdeas.getAttribute("contenteditable") === "false") {
            mainIdeas.setAttribute("contenteditable", "true");
            mainIdeas.focus();
            let timer = new SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let ideas = mainIdeas.innerText.split("\n");
                let ideasString = ideas.join("");
                let currentIdeas = this._chapter.mainIdeas.join("");
                if (!confirmationPopup && ideasString !== currentIdeas) {
                    await this._document.setChapterMainIdeas(this._chapter, ideas);
                    mainIdeas.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${mainIdeas.offsetWidth/2}"></confirmation-popup>`);
                }
            }, 1000);
            mainIdeas.addEventListener("blur", async () => {
                mainIdeas.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                mainIdeas.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            mainIdeas.addEventListener("keydown", resetTimer);
        }
    }

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async openChapterEditPage(){
        await webSkel.changeToDynamicPage("chapter-edit-page", `documents/${this._document.id}/chapter-edit-page/${this._chapter.id}`);
    }
    async addParagraph(){
        let flowId = webSkel.currentUser.space.getFlowIdByName("AddParagraph");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id);
        this.invalidate();
    }
    async summarize(){
        await showModal(document.querySelector("body"), "summarize-chapter-modal", { presenter: "summarize-chapter-modal"});
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