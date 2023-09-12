export class documentSettingsPage {
    constructor() {
        this.id = webSkel.company.currentDocumentId;
        this.showChaptersInSidebar = 0;
        if(webSkel.company.documents) {
            this._documentConfigs = webSkel.company.documents;
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = (companyData)=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
        this.documentService = webSkel.initialiseService('documentService');
        this._document = this.documentService.getDocument(this.id);
    }

    beforeRender() {
        this.chapterSidebar = "";
        if (this._document.chapters) {
            let iterator = 0;
            this._document.chapters.forEach((item) => {
                iterator++;
                this.chapterSidebar += `<div class="submenu-item">Edit Chapter ${iterator}</div>`;
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

}