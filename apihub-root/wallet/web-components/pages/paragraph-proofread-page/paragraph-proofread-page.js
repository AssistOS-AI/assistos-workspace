export class paragraphProofreadPage {
    constructor(element, invalidate) {
        this.element=element;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this._chapter = this._document.getChapter(webSkel.space.currentChapterId);
        this._paragraph = this._chapter.getParagraph(webSkel.space.currentParagraphId);
        this.invalidate = invalidate;
        this.invalidate();

    }

    beforeRender() {
        this.chapterNr = this._document.chapters.findIndex(chapter => chapter.id === this._chapter.id) + 1;
        this.paragraphNr = this._chapter.paragraphs.findIndex(paragraph => paragraph.id === this._paragraph.id) + 1;
        this.paragraphText = this._paragraph.text;
        document.removeEventListener("click", this.exitEditMode, true);
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
        const loading = await webSkel.showLoading();
        let scriptId = webSkel.space.getScriptIdByName("proofread");
        let result = await webSkel.getService("LlmsService").callScript(scriptId, this.paragraphText);
        this.improvedParagraph = result.responseString || result.responseJson;
        loading.close();
        loading.remove();
        this.invalidate();
    }

    async enterEditMode(_target, field) {
        let paragraph = this.element.querySelector(`.${field}`);
        if(!paragraph.hasAttribute("contenteditable")){
            document.addEventListener("click", this.exitEditMode.bind(this, paragraph), true);
        }
        paragraph.setAttribute("contenteditable", "true");
        paragraph.focus();
    }

    async exitEditMode (paragraph, event) {
        if (paragraph.getAttribute("contenteditable") && !paragraph.contains(event.target)) {
            paragraph.setAttribute("contenteditable", "false");
            if(paragraph.classList.contains("paragraph-content")){
                await this._document.updateParagraph(this._paragraph, paragraph.innerText);
            }
            else {
                this.improvedParagraph = paragraph.innerText;
            }
        }
    }


    async acceptImprovements(_target) {
        let paragraph = this.element.querySelector(".improved-paragraph").innerText;
        if(paragraph !== this._paragraph.text) {
            await this._document.updateParagraph(this._paragraph, paragraph);
            this.invalidate();
        }
    }
}

