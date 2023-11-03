import {
    extractFormInformation,
    showModal,
    closeModal,
    showActionBox, reverseQuerySelector, removeActionBox, sanitize
} from "../../../imports.js";

export class chapterTitlePage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this._chapter= this._document.getChapter(webSkel.space.currentChapterId);
        this._document.observeChange(this._document.getNotificationId() + "chapter-title-page", invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.title = this._chapter.title;
        this.alternativeTitles = "";
        if (this._chapter.alternativeTitles) {
            for (let i = 0; i < this._chapter.alternativeTitles.length; i++) {
                this.alternativeTitles += `<alternative-title data-nr="${i + 1}" data-title="${this._chapter.alternativeTitles[i].title}" 
                data-id="${this._chapter.alternativeTitles[i].id}" data-local-action="edit querySelect"></alternative-title>`;
            }
        }
    }

    async saveTitle(_target) {
        const formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            const documentIndex = webSkel.space.documents.findIndex(doc => doc.id === this.docId);
            const chapterIndex = this._document.getChapterIndex(this.chapterId);
            if (documentIndex !== -1 && chapterIndex !== -1 && formInfo.data.title !== this._document.getChapterTitle(this.chapterId)) {
                this._document.updateChapterTitle(this.chapterId, formInfo.data.title);
                await documentFactory.updateDocument(currentSpaceId, this._document);
            }
        }
    }

    async openChapterTitlePage() {
        await webSkel.changeToDynamicPage("chapter-title-page",
            `documents/${this.docId}/chapter-title-page/${this._chapter.id}`);

    }
    async edit(_target, querySelect) {
        let confirmationPopup = this.element.querySelector("confirmation-popup");
        if(confirmationPopup){
            confirmationPopup.remove();
        }
        let newTitle;
        if(querySelect){
            newTitle = _target.querySelector(".suggested-title");
        }else {
            newTitle = reverseQuerySelector(_target, ".suggested-title");
        }

        let component = reverseQuerySelector(_target, "alternative-title")
        let altTitleObj = this._chapter.getAlternativeTitle(component.getAttribute("data-id"));
        newTitle.contentEditable = true;
        newTitle.focus();

        newTitle.addEventListener('blur', async () => {
            newTitle.contentEditable = false;

            if(newTitle.innerText !== altTitleObj.name) {
                await this._chapter.updateAlternativeTitle(altTitleObj.id, sanitize(newTitle.innerText));
            }
            newTitle.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                data-message="Saved!" data-left="${newTitle.offsetWidth/2}"></confirmation-popup>`);
        }, {once:true});
    }
    async delete(_target) {
        let alternativeTitle = reverseQuerySelector(_target, "alternative-title");
        this._chapter.deleteAlternativeTitle(alternativeTitle.getAttribute("data-id"));
        await documentFactory.updateDocument(currentSpaceId, this._document);
        this.invalidate();
    }
    async select(_target){
        let suggestedTitle = reverseQuerySelector(_target, "alternative-title");
        let suggestedTitleId = suggestedTitle.getAttribute("data-id");
        await this._chapter.selectAlternativeTitle(suggestedTitleId);
        await documentFactory.updateDocument(currentSpaceId, this._document);
        this.invalidate();
    }
    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async showSuggestChapterTitlesModal() {
        await showModal(document.querySelector("body"), "suggest-chapter-titles-modal", { presenter: "suggest-chapter-titles-modal"});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}