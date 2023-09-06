import { closeModal, showActionBox } from "../../../WebSkel/utils/modal-utils.js";
import { showModal } from "../../utils/modal-utils.js";

export class editTitlePage {
    constructor() {
        this.docTitle = "Current Title";
        this.id = company.currentDocumentId;
        this.showChaptersInSidebar = 0;
        if(company.documents) {
            this._documentConfigs = (company.documents);
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = ()=> {
            this._documentConfigs = company.documents;
            this._document = company.getDocument(this.id);
            this.docTitle = this._document.title;
            this.invalidate();
        }
        company.onChange(this.updateState);

        this._document = company.getDocument(this.id);
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
            this.chapters.forEach((item) => {
                this.chapterSidebar += `<div class="submenu-item">Edit ${item.title}</div>`;
            });
        }
    }

    saveTitle() {
        const updatedTitle = document.querySelector(".document-title").value;
        const documentId = company.currentDocumentId;
        const documentIndex = company.documents.findIndex(doc => doc.id === documentId);
        if (documentIndex !== -1 && updatedTitle !==company.documents[documentIndex].title) {
            company.documents[documentIndex].updateDocumentTitle(updatedTitle);
            company.updateDocument(company.currentDocumentId, company.documents[documentIndex]);
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

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}