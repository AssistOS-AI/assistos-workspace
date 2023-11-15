import {
    Paragraph,
    showActionBox,
    reverseQuerySelector, SaveElementTimer, sanitize, parseURL, showModal
} from "../../../imports.js";
export class manageChaptersPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.currentUser.space.getDocument(parseURL());
        this.invalidate = invalidate;
        this.invalidate();
        this._document.observeChange(this._document.getNotificationId() + ":manage-chapters-page", invalidate);
        this.mainIdeas = this._document.getMainIdeas();
    }

    beforeRender() {
        if(this.mainIdeas.length === 0) {
            this.summarizeButtonName = "Summarize";
        } else {
            this.summarizeButtonName = "Recreate Summary";
            this.docMainIdeas = "";
            for(let idea of this.mainIdeas){
                this.docMainIdeas += `<li>${sanitize(idea)}</li>`;
            }
        }
        this.chaptersDiv= "";
        let number = 0;
        this._document.chapters.forEach((item) => {
            number++;
            this.chaptersDiv += `<reduced-chapter-unit nr="${number}." title="${sanitize(item.title)}" 
            data-id="${item.id}" data-local-action="editAction"></reduced-chapter-unit>`;
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
                let currentIdeas = this._document.mainIdeas.join("");
                if (!confirmationPopup && ideasString !== currentIdeas) {
                    await this._document.setMainIdeas(ideas);
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
    async addChapter(){
        let chapterObj={
            title: "New chapter",
            paragraphs: [new Paragraph({text: "Edit here your first paragraph."})]
        }
        await this._document.addChapter(chapterObj,this._document.chapters.length);
        this.invalidate();
    }
    async summarize(){
        await showModal(document.querySelector("body"), "summarize-document-modal", { presenter: "summarize-document-modal"});
    }

    async generateChapters(){
        await webSkel.changeToDynamicPage("generate-chapters-page", `documents/${this._document.id}/generate-chapters-page`);
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async editAction(_target){
        let chapter = reverseQuerySelector(_target, "reduced-chapter-unit");
        let chapterId = chapter.getAttribute("data-id");
        debugger;
        await webSkel.changeToDynamicPage("chapter-brainstorming-page",
            `documents/${this._document.id}/chapter-brainstorming-page/${chapterId}`);
    }
    async deleteAction(_target){
        let chapter = reverseQuerySelector(_target, "reduced-chapter-unit");
        let chapterId = chapter.getAttribute("data-id");
        await this._document.deleteChapter(chapterId);
        this.invalidate();
    }
}