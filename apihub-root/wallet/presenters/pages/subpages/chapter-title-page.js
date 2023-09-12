import { closeModal, showActionBox } from "../../../../WebSkel/utils/modal-utils.js";
import { showModal } from "../../../utils/modal-utils.js";
import { extractFormInformation } from "../../../imports.js";

export class chapterTitlePage {
    constructor() {
        this.docTitle = "Current Title";
        this.id = webSkel.company.currentDocumentId;
        this.showChaptersInSidebar = 0;

        if(webSkel.company.documents) {
            this._documentConfigs = webSkel.company.documents;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.documentService = webSkel.initialiseService('documentService');

        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this._document = this.documentService.getDocument(this.id);
            this.docTitle = this._document.title;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);

        this._document = this.documentService.getDocument(this.id);

        if(this._document) {
            this.docTitle = this._document.title;
            this.chapters = this._document.chapters;
        }
    }

    beforeRender() {
        this.title = `<title-edit title="${this.docTitle}"></title-edit>`;
        this.alternativeTitles = "";
        this.chapterSidebar = "";
        if(this._document) {
            let suggestedTitle = "Bees are nature's little pollination superheroes! Let's protect them and ensure our food chain thrives. #SaveTheBees";
            for(let number = 1; number <= 10; number++) {
                this.alternativeTitles += `<alternative-title-renderer nr="${number}" title="${suggestedTitle}"></alternative-title-renderer>`;
            }
            let iterator = 0;
            this._document.chapters.forEach((item) => {
                iterator++;
                this.chapterSidebar += `<div class="submenu-item">Edit Chapter ${iterator}</div>`;
            });
        }
    }

    async saveTitle(_target) {
        const formInfo = await extractFormInformation(_target);
        if(formInfo.isValid){
            const documentId = webSkel.company.currentDocumentId;
            const documentIndex = webSkel.company.documents.findIndex(doc => doc.id === documentId);
            if (documentIndex !== -1 && formInfo.data.title !==webSkel.company.documents[documentIndex].title) {
                this.documentService.updateDocumentTitle(webSkel.company.documents[documentIndex],formInfo.data.title);
                this.documentService.updateDocument(webSkel.company.documents[documentIndex],webSkel.company.currentDocumentId);
            }
        }
    }

    openEditTitlePage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-title`);
    }

    openEditAbstractPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-abstract`);
    }

    openDocumentSettingsPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/settings`);
    }

    openBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/brainstorming`);
    }

    showEditChapterSubmenu() {
        const chapterSubmenuSection = document.querySelector(".sidebar-submenu");
        const sidebarArrow = document.querySelector(".arrow-sidebar");
        if(this.showChaptersInSidebar === 0) {
            chapterSubmenuSection.style.display = "inherit";
            sidebarArrow.classList.remove('rotate');
            this.showChaptersInSidebar = 1;
        }
        else {
            chapterSubmenuSection.style.display = "none";
            sidebarArrow.classList.toggle('rotate');
            this.showChaptersInSidebar = 0;
        }
    }

    openViewPage() {
        webSkel.changeToStaticPage(`documents/${this.id}`);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async showSuggestTitleModal() {
        await showModal(document.querySelector("body"), "suggest-title-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}