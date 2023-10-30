import {reverseQuerySelector, showActionBox} from "../../../imports.js";

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
        mainIdeas.addEventListener("input", function (event) {
            if(event.target.tagName === "UL"){
                for(let child of event.target.children){
                    if(child.innerHTML === "<br>"){
                        child.innerHTML = "";
                    }
                }
            }
            if (event.target.tagName === "LI") {
                if (event.target.innerText.trim() === "") {
                    event.target.style.listStyle = "none"; // Remove the marker
                } else {
                    event.target.style.listStyle = "initial"; // Restore the marker
                }

            }
        });
    }
    async enterEditMode(_target) {
        let mainIdeas = this.element.querySelector(".main-ideas-list");
        if(!mainIdeas.hasAttribute("contenteditable")){
            document.addEventListener("click", this.exitEditMode.bind(this, mainIdeas), true);
        }
        mainIdeas.setAttribute("contenteditable", "true");
        mainIdeas.focus();
    }

    async exitEditMode (mainIdeas, event) {
        if (mainIdeas.getAttribute("contenteditable") && !mainIdeas.contains(event.target)) {
            mainIdeas.setAttribute("contenteditable", "false");
            let ideas = mainIdeas.innerText.split("\n");
            await this._document.setChapterMainIdeas(this._chapter, ideas);
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