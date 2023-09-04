import { Company } from "../../core/company.js";
import { closeModal, showActionBox, showModal } from "../../../WebSkel/utils/modal-utils.js";

export class editAbstractPage {
    constructor() {
        this.id = webSkel.registry.currentDocumentId;
        let currentCompany = Company.getInstance();
        this.showChaptersInSidebar = 0;
        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = (companyState)=> {
            console.log("Update State");
            this._documentConfigs = companyState.documents;
            this.invalidate();
        }
        currentCompany.onChange(this.updateState);
        this._document = webSkel.registry.getDocument(this.id);
        if(this._document) {
            this.docTitle = this._document.name;
            if(this._document.abstract) {
                this.abstractText = this._document.abstract;
            }
            this.chapters = this._document.chapters;
        }
    }

    beforeRender() {
        this.title = `<title-view title="${this.docTitle}"></title-view>`;
        this.alternativeAbstracts = "";
        this.chapterSidebar = "";
        if(this.chapters) {
            let suggestedTitle = "Bees are nature's little pollination superheroes! Let's protect them and ensure our food chain thrives. #SaveTheBees";
            for(let number = 1; number <= 10; number++) {
                this.alternativeAbstracts += `<alternative-abstract-renderer nr="${number}" title="${suggestedTitle}"></alternative-abstract-renderer>`;
            }
            this.chapters.forEach((item) => {
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

    async showSuggestAbstractModal() {
        await showModal(document.querySelector("body"), "suggest-abstract-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}