import {reverseQuerySelector, showActionBox, showModal, removeActionBox} from "../../../imports.js";

export class chapterBrainstormingPage {
    constructor(element, invalidate) {
        this.element = element;
        let chapterId=window.location.hash.split("/")[3];
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this._chapter = this._document.getChapter(chapterId);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.chapterTitle=this._chapter.title;
        this.chapterContent="";
        this.alternativeChapters = "";
        let alternativeChapterText = "";
        let number = 0;
        this._chapter.paragraphs.forEach((item) => {
            number++;
            this.chapterContent += `<reduced-paragraph-unit data-id="${item.id}" data-local-action="editAction"
            data-nr="${number}" data-text="${item.text}"></reduced-paragraph-unit>`;
        });
        this._chapter.alternativeChapters.forEach((item) => {
            alternativeChapterText = "";
            item.paragraphs.forEach((paragraph) => {
                alternativeChapterText+=paragraph.text;
            })
            this.alternativeChapters += `<reduced-chapter-unit text="${alternativeChapterText}" id="${item.id}"></reduced-chapter-unit>`;
        });
    }

    async enterEditMode(_target) {
        let title = reverseQuerySelector(_target, ".main-idea-title");
        title.setAttribute("contenteditable", "true");
        title.focus();
        document.addEventListener("click", this.exitEditMode.bind(this, title), true);
    }
    async exitEditMode (title, event) {
        if (title.getAttribute("contenteditable") && !title.contains(event.target)) {
            title.setAttribute("contenteditable", "false");
            this._chapter.title = title.innerText;
            await documentFactory.updateDocument(currentSpaceId, this._document);
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
        const loading = await webSkel.showLoading();
        let scriptId = webSkel.space.getScriptIdByName("summarize");
        let result = await webSkel.getService("LlmsService").callScript(scriptId, this._paragraph.toString());
        this.paragraphMainIdea = result.responseJson[0];

        await this._document.setParagraphMainIdea(this._paragraph, result.responseJson);
        loading.close();
        loading.remove();
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
                await this._document.updateAlternativeParagraph(this._paragraph, paragraphId, paragraph.innerText)
            }
        });
    }
    async delete(_target){
        let paragraph = reverseQuerySelector(_target, "alternative-paragraph");
        let paragraphId = paragraph.getAttribute("data-id");
        await this._document.deleteAlternativeParagraph(this._paragraph, paragraphId);
        this.invalidate();
    }

    async select(_target){
        let paragraphText = reverseQuerySelector(_target,".content").innerText;
        if(paragraphText !== this._paragraph.text) {
            await this._document.updateParagraph(this._paragraph, paragraphText);
            this.invalidate();
        } else {
            removeActionBox(this.actionBox, this);
        }
    }
}