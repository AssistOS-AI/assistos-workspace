import { Company } from "../../core/company.js";

export class docPageById {
    constructor() {
        this.docTitle = "Documents";
        this.name = "Name";
        this.abstractText = "Edit your abstract";
        this.button = "Add new document";
        this.chapterSidebar = "";
        this.showChaptersInSidebar = 0;
        this.id = webSkel.registry.currentDocumentId;
        let currentCompany = Company.getInstance(webSkel.registry.storageData);
        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = (companyState)=> {
            this._document = webSkel.registry.getDocument(this.id);
            console.log("Update State");
            this._documentConfigs = currentCompany.companyState.documents;
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
        this.chapterDivs = "";
        this.title = `<title-view title="${this.docTitle}"></title-view>`;
        if(this.chapters) {
            this.chapters.forEach((item) => {
                this._document.setCurrentChapter(item.id);
                this.chapterDivs += `<chapter-item data-chapter-title="${item.title}" chapter-id="${item.id}" data-presenter="chapter-item"></chapter-item>`;
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