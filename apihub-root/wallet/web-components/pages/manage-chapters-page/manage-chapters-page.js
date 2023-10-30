import {Paragraph, showActionBox, reverseQuerySelector} from "../../../imports.js";
export class manageChaptersPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this.invalidate = invalidate;
        this.invalidate();
        this.mainIdeas = this._document.getMainIdeas();
    }

    beforeRender() {
        if(this.mainIdeas.length === 0) {
            this.summarizeButtonName = "Summarize";
        } else {
            this.summarizeButtonName = "Recreate Summary";
            this.docMainIdeas = "";
            for(let idea of this.mainIdeas){
                this.docMainIdeas += `<li>${idea}</li>`;
            }
        }
        this.chaptersDiv= "";
        let number = 0;
        this._document.chapters.forEach((item) => {
            number++;
            this.chaptersDiv += `<reduced-chapter-unit nr="${number}." title="${item.title}" 
            data-id="${item.id}" data-local-action="editAction"></reduced-chapter-unit>`;
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
            await this._document.setMainIdeas(ideas);
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
        await this._document.addChapter(chapterObj);
        this.invalidate();
    }
    async summarize(){
        let scriptId = webSkel.space.getScriptIdByName("summarize");
        let result = await webSkel.getService("LlmsService").callScript(scriptId, this._document.stringifyDocument());
        this.mainIdeas = result.responseJson;

        await this._document.setMainIdeas(result.responseJson);
        this.invalidate();
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