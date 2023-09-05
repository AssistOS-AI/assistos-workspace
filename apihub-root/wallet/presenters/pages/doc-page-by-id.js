import { Company } from "../../core/company.js";

export class docPageById {
    constructor() {
        this.docTitle = "Documents";
        this.name = "Name";
        this.abstractText = "Edit your abstract";
        this.button = "Add new document";
        this.chapterSidebar = "";
        this.showChaptersInSidebar = 0;
        this.id = company.currentDocumentId;

        if(company.documents) {
            this._document = company.getDocument(this.id);
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = (companyState)=> {
            this._document = company.getDocument(this.id);
            this.invalidate();
        }
        company.onChange(this.updateState);
        if(this._document) {
            this.docTitle = this._document.title;
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
            this._document.setCurrentChapter(this.chapters[0].id);
            this.chapters.forEach((item) => {
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
}