import { Company } from "../../core/company.js";
import { Registry } from "../../core/services/registry.js";

export class docPageById {
    constructor() {
        this.title = "Documents";
        this.name = "Name";
        this.abstractText = "Edit your abstract";
        this.button = "Add new document";
        this.chapterSidebar = "";
        this.showChaptersInSidebar = 0;
        let currentCompany = Company.getInstance();
        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = (companyState)=> {
            console.log("Update State");
            this._documentConfigs = currentCompany.companyState.documents;
            this.invalidate();
        }
        currentCompany.onChange(this.updateState);
    }

    beforeRender() {
        this.id = webSkel.registry.currentDocumentId;
        // let documentContent = document.querySelector("doc-page-by-id");
        // if(documentContent) {
        //     this.id = parseInt(documentContent.getAttribute("data-document-id"));
        // }
        if(this._documentConfigs) {
            this._doc = this._documentConfigs.find(document => document.id === this.id);
            try {
                this.title = this._doc.name;
                if(this._doc.abstract) {
                    this.abstractText = this._doc.abstract;
                }
                if(this._doc.chapters.length > 0) {
                    this.chapters = this._doc.chapters;
                }
                this.chapterDivs = "";
                this._document = webSkel.registry.getDocument(this.id);
                this.chapters.forEach((item) => {
                    this._document.setCurrentChapter(item.id);
                    this.chapterDivs += `<chapter-item data-chapter-title="${item.title}" chapter-id="${item.id}" data-presenter="chapter-item" data-chapter-content="${item.paragraphs}"></chapter-item>`;
                    this.chapterSidebar += `<div class="submenu-item">Edit ${item.title}</div>`;
                });
            } catch(e) {}
        } else {
            this.chapterDivs = `<div> No Data Currently </div>`;
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

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}