import { Company } from "../../core/company.js";

export class docPageByTitle {
    constructor() {
        this.title = "Documents";
        this.name = "Name";
        this.abstractText = "Abstract text";
        this.button = "Add new document";
        this.chapterSidebar = "";
        this.showChaptersInSidebar = 0;
        let currentCompany = Company.getInstance();

        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            console.log(this._documentConfigs.length);
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = (companyState)=> {
            console.log("Update State");
            this._documentConfigs = currentCompany.companyState.documents;
            this.invalidate();
        }
        currentCompany.onChange(this.updateState);
    }

    beforeRender() {
        let documentContent = document.querySelector("doc-page-by-title");
        /* Quick Fix - To be removed */
        if(documentContent) {
            this.id = parseInt(documentContent.getAttribute("data-document-id"));
        }
        this.chapters = "";
        let doc;
        if(this._documentConfigs) {
            /*this._doc = this._documentConfigs.find(document => document.id === this.id);*/
            for(let document of this._documentConfigs) {
                if(document.id === this.id) {
                    doc = document;
                    break;
                }
            }
            this._doc = doc;
            try {
                this.title = this._doc.name;
                this.abstractText = this._doc.abstract;
                this._doc.chapters.forEach((item) => {
                    this.chapters += `<chapter-item data-chapter-title="${item.name}" chapter-id="${item.name.split(' ')[1]}" data-chapter-content="${item.content}"></chapter-item>`;
                    this.chapterSidebar += `<div class="submenu-item">Edit ${item.name}</div>`;
                });
            } catch(e) {}
        } else {
            this.chapters=`<div> No Data Currently </div>`;
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

    showOrHideChapter(chapterId) {
        let target = document.querySelector(`[data-id="${chapterId}"]`);
        target.firstElementChild.nextElementSibling.classList.toggle('hidden');
        target.firstElementChild.firstElementChild.classList.toggle('rotate');
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}