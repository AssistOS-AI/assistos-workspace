import { Company } from "../../core/company.js";

export class documentSettingsPage {
    constructor() {
        this.id = company.currentDocumentId;
        this.showChaptersInSidebar = 0;
        if(company.documents) {
            this._documentConfigs = company.documents;
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = (companyData)=> {
            this._documentConfigs = company.documents;
            this.invalidate();
        }
        company.onChange(this.updateState);

        this._document = company.getDocument(this.id);
        if(this._document) {
            this.title = this._document.title;
            this.chapters = this._document.chapters;
        }
    }

    beforeRender() {
        this.chapterSidebar = "";
        if(this.chapters) {
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

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}