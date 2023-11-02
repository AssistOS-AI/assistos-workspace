import {reverseQuerySelector, SaveElementTimer} from "../../../imports.js";

export class documentViewPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this._document.observeChange(this._document.getNotificationId() + ":document-view-page", invalidate);
        this._document.observeChange(this._document.getNotificationId() + ":refresh", invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.chaptersContainer = "";
        this.docTitle = this._document.title;
        this.abstractText=this._document.abstract||"No abstract has been set or generated for this document";
        if(this._document.chapters.length > 0) {
            this._document.setCurrentChapter(this._document.chapters[0].id);
            let iterator = 0;
            this._document.chapters.forEach((item) => {
                iterator++;
                this.chaptersContainer += `<chapter-unit data-chapter-number="${iterator}" data-chapter-title="${item.title}" data-chapter-id="${item.id}" data-presenter="chapter-unit"></chapter-unit>`;
            });
        }
    }
    async editAbstract(abstract){
        if (abstract.getAttribute("contenteditable") === "false") {
            let abstractSection = reverseQuerySelector(abstract,".abstract-section");
            abstract.setAttribute("contenteditable", "true");
            abstract.focus();
            abstractSection.setAttribute("id", "highlighted-chapter");
            let timer = new SaveElementTimer(async () => {
                if (abstract.innerText !== this._document.abstract) {
                    await this._document.updateAbstract(abstract.innerText);
                }
            }, 1000);
            abstract.addEventListener("blur", async () => {
                abstract.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                abstract.setAttribute("contenteditable", "false");
                abstractSection.removeAttribute("id");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            abstract.addEventListener("keydown", resetTimer);
        }
    }
    async addChapter() {
        let chapterData= {
            title: "New Chapter",
            id: webSkel.servicesRegistry.UtilsService.generateId(),
            paragraphs: [
                {
                    id:webSkel.servicesRegistry.UtilsService.generateId(),
                    text: "New Paragraph"
                }
            ]
        }
        await this._document.addChapter(chapterData);
        webSkel.space.currentChapterId=chapterData.id;
        this.invalidate();
    }
    async addParagraph(_target){
        let chapter = this._document.getChapter(webSkel.space.currentChapterId);
        let newParagraphId=webSkel.getService("UtilsService").generateId();
        await chapter.addParagraph({id: newParagraphId, text:""},chapter.paragraphs.length);
        webSkel.space.currentParagraphId=newParagraphId;
        this._document.notifyObservers(this._document.getNotificationId()+":document-view-page:"+"chapter:"+`${chapter.id}`);
    }

    afterRender() {
    }

    editTitle(title){
        if (title.getAttribute("contenteditable") === "false") {
            title.setAttribute("contenteditable", "true");
            title.focus();
            title.parentElement.setAttribute("id", "highlighted-chapter");
            let timer = new SaveElementTimer(async () => {
                if (title.innerText !== this._document.title) {
                    await this._document.updateTitle(title.innerText);
                }
            }, 1000);
            title.addEventListener("blur", async () => {
                title.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                title.setAttribute("contenteditable", "false");
                title.parentElement.removeAttribute("id");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            title.addEventListener("keydown", resetTimer);
        }
    }

    async openEditTitlePage() {
        await webSkel.changeToDynamicPage("edit-title-page", `documents/${this._document.id}/edit-title-page`);
    }

    async openEditAbstractPage() {
        await webSkel.changeToDynamicPage("edit-abstract-page", `documents/${this._document.id}/edit-abstract-page`);
    }

    async openDocumentSettingsPage() {
        await webSkel.changeToDynamicPage("document-settings-page", `documents/${this._document.id}/document-settings-page`);
    }

    async openManageChaptersPage() {
        await webSkel.changeToDynamicPage("manage-chapters-page", `documents/${this._document.id}/manage-chapters-page`);
    }

    async openChapterBrainstormingPage() {
        await webSkel.changeToDynamicPage("chapter-brainstorming-page",
            `documents/${this._document.id}/chapter-brainstorming-page/${webSkel.space.currentChapterId}`);

    }

    async openManageParagraphsPage() {
        await webSkel.changeToDynamicPage("manage-paragraphs-page",
            `documents/${this._document.id}/manage-paragraphs-page/${webSkel.space.currentChapterId}`);
    }

    async openParagraphProofreadPage() {
        await webSkel.changeToDynamicPage("paragraph-proofread-page",
            `documents/${this._document.id}/paragraph-proofread-page/${webSkel.space.currentChapterId}/${webSkel.space.currentParagraphId}`);
    }

    async openParagraphBrainstormingPage() {
        await webSkel.changeToDynamicPage("paragraph-brainstorming-page",
            `documents/${this._document.id}/paragraph-brainstorming-page/${webSkel.space.currentChapterId}/${webSkel.space.currentParagraphId}`);
    }
    async openEditChapterTitlePage() {
        await webSkel.changeToDynamicPage("chapter-title-page",
            `documents/${this._document.id}/chapter-title-page/${webSkel.space.currentChapterId}`);
    }
    async openDocumentViewPage(){
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }
}