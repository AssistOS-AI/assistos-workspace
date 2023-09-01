import { Company } from "../../core/company.js";

export class docPageById {
    constructor() {
        this.title = "Documents";
        this.name = "Name";
        this.abstractText = "Edit your abstract";
        this.button = "Add new document";
        this.chapterSidebar = "";
        this.showChaptersInSidebar = 0;
        this.chapters = [
            {
                name: "Chapter 1",
                content: /*[
                    "<p>Chapter 1 content<p>"
                ],
            },
            {
                name: "Chapter 2",
                content: [
                    `<p>Lorem ipsum dolor sit amet, ut sed ornatus sapientem vituperata. Diam minim percipit et duo. Ad errem legimus democritum sed, vix ut iuvaret patrioque, ut nec tritani suscipit assentior. Et illud assum atomorum eum. Eam justo quaeque eu, eam ne clita luptatum, modus elaboraret sadipscing has cu. Ne usu adhuc congue graeco.</p>
                    <p>Legere invenire ut eos, no vim habeo dicit signiferumque. Ad agam commune has. Commodo efficiantur pri no, dictas civibus corrumpit ad his. Ea pri alia volumus assentior, eos ut odio inani. Vide integre senserit in eum, inermis complectitur sea ea. Mei adolescens theophrastus ne, an veniam epicuri est.</p>
                    <p>Ei eum quodsi aliquam, utinam aliquam utroque eam no. Ei eum quodsi aliquam, utinam aliquam utroque eam no. Ei eum quodsi aliquam, utinam aliquam utroque eam no. Ei eum quodsi aliquam, utinam aliquam utroque eam no. Ei eum quodsi aliquam, utinam aliquam utroque eam no. Ei eum quodsi aliquam, utinam aliquam utroque eam no.</p>`
                ],*/ "Chapter 1 content",
            },
        ];
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
        let documentContent = document.querySelector("doc-page-by-id");
        /* Quick Fix - To be removed */
        if(documentContent) {
            this.id = parseInt(documentContent.getAttribute("data-document-id"));
        }
        this.chapterDivs = "";
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
                if(this._doc.abstract) {
                    this.abstractText = this._doc.abstract;
                }
                if(this._doc.chapters.length > 0) {
                    this.chapters = this._doc.chapters;
                }
                this.chapters.forEach((item) => {
                    this.chapterDivs += `<chapter-item data-chapter-title="${item.chapterTitle}" chapter-id="${item.id}" data-chapter-content="${item.content}"></chapter-item>`;
                    this.chapterSidebar += `<div class="submenu-item">Edit ${item.chapterTitle}</div>`;
                });
            } catch(e) {}
        } else {
            this.chapterDivs=`<div> No Data Currently </div>`;
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

    showOrHideChapter(_target, chapterId) {
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