import { closeModal, showActionBox } from "../../imports.js"
import { showModal } from "../../imports.js"

export class brainstormingPage {
    constructor() {
        let url = window.location.hash;
        this.id = parseInt(url.split('/')[1]);
        this.docTitle = "Titlu document";
        // this.showChaptersInSidebar = 0;
        if(webSkel.company.documents) {
            this._documentConfigs = (webSkel.company.documents);
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);

        this.documentService = webSkel.initialiseService('documentService');
        this._document = this.documentService.getDocument(this.id);
        if(this._document) {
            this.docTitle = this._document.title;
            if(this._document.abstract) {
                this.abstractText = this._document.abstract;
            }
        }
    }

    beforeRender() {
        this.chaptersDiv = "";
        this.title = `<title-view title="${this.docTitle}"></title-view>`;
        if(this._document) {
            let number = 0;
            this._document.chapters.forEach((item) => {
                number++;
                this.chaptersDiv += `<chapters-brainstorming-renderer nr="${number}" title="${item.title}"></chapters-brainstorming-renderer>`;
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

    // showEditChapterSubmenu() {
    //     const chapterSubmenuSection = document.querySelector(".sidebar-submenu");
    //     const sidebarArrow = document.querySelector(".arrow-sidebar");
    //     if(this.showChaptersInSidebar === 0) {
    //         chapterSubmenuSection.style.display = "inherit";
    //         sidebarArrow.classList.remove('rotate');
    //         this.showChaptersInSidebar = 1;
    //     }
    //     else {
    //         chapterSubmenuSection.style.display = "none";
    //         sidebarArrow.classList.toggle('rotate');
    //         this.showChaptersInSidebar = 0;
    //     }
    // }

    async showAddChapterModal() {
        await showModal(document.querySelector("body"), "add-chapter-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}