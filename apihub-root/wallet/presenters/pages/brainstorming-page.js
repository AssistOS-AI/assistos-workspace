import { Company } from "../../core/company.js";
import { closeModal, showActionBox } from "../../../WebSkel/utils/modal-utils.js";
import { showModal } from "../../utils/modal-utils.js";

export class brainstormingPage {
    constructor() {
        this.id = webSkel.company.currentDocumentId;
        this.docTitle = "Titlu document";
        this.showChaptersInSidebar = 0;
        if(webSkel.company.documents) {
            this._documentConfigs = (webSkel.company.documents);
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);

        this._document = webSkel.company.getDocument(this.id);
        if(this._document) {
            this.docTitle = this._document.title;
            if(this._document.abstract) {
                this.abstractText = this._document.abstract;
            }
            this.chapters = this._document.chapters;
        }
    }

    beforeRender() {
        let suggestedTitle = "Bees are nature's little pollination superheroes! Let's protect them and ensure our food chain thrives. #SaveTheBees";
        this.alternativeAbstracts = "";
        this.chapterSidebar = "";
        this.title = `<title-view title="${this.docTitle}"></title-view>`;
        if(this._document) {
            for(let number = 1; number <= 10; number++) {
                this.alternativeAbstracts += `<alternative-abstract-renderer nr="${number}" title="${suggestedTitle}"></alternative-abstract-renderer>`;
            }
            this._document.chapters.forEach((item) => {
                this.chapterSidebar += `<div class="submenu-item">Edit ${item.title}</div>`;
            });
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

    openViewPage() {
        webSkel.changeToStaticPage(`documents/${this.id}`);
    }

    closeModal(_target) {
        closeModal(_target);
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

    async showAddIdeaModal() {
        await showModal(document.querySelector("body"), "suggest-abstract-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}