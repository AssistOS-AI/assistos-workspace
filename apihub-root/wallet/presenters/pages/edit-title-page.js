import { Company } from "../../core/company.js";
import { closeModal, showActionBox, showModal } from "../../../WebSkel/utils/modal-utils.js";

export class editTitlePage {
    constructor() {
        this.title = "Current Title";
        let currentCompany = Company.getInstance();

        this.chapters = [
            {
                name: "Chapter 1",
                content: [
                    "<p>Chapter 1 content<p>"
                ],
            },
            {
                name: "Chapter 2",
                content: [
                    `<p>Lorem ipsum dolor sit amet, ut sed ornatus sapientem vituperata. Diam minim percipit et duo. Ad errem legimus democritum sed, vix ut iuvaret patrioque, ut nec tritani suscipit assentior. Et illud assum atomorum eum. Eam justo quaeque eu, eam ne clita luptatum, modus elaboraret sadipscing has cu. Ne usu adhuc congue graeco.</p>
                    <p>Legere invenire ut eos, no vim habeo dicit signiferumque. Ad agam commune has. Commodo efficiantur pri no, dictas civibus corrumpit ad his. Ea pri alia volumus assentior, eos ut odio inani. Vide integre senserit in eum, inermis complectitur sea ea. Mei adolescens theophrastus ne, an veniam epicuri est.</p>
                    <p>Ei eum quodsi aliquam, utinam aliquam utroque eam no. Ei eum quodsi aliquam, utinam aliquam utroque eam no. Ei eum quodsi aliquam, utinam aliquam utroque eam no. Ei eum quodsi aliquam, utinam aliquam utroque eam no. Ei eum quodsi aliquam, utinam aliquam utroque eam no. Ei eum quodsi aliquam, utinam aliquam utroque eam no.</p>`
                ],
            },
        ];

        this.chapterSidebar = "";
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
    }

    beforeRender() {
        let documentContent = document.querySelector("edit-title-page");
        if(documentContent) {
            this.id = parseInt(documentContent.getAttribute("data-document-id"));
        }
        this.alternativeTitles = "";
        if(this._documentConfigs) {
            this._doc = this._documentConfigs.find(document => document.id === this.id);
            try {
                this.title = this._doc.name;
                let suggestedTitle = "Bees are nature's little pollination superheroes! Let's protect them and ensure our food chain thrives. #SaveTheBees";
                for(let number = 1; number <= 10; number++) {
                    this.alternativeTitles += `<alternative-title-renderer nr="${number}" title="${suggestedTitle}"></alternative-title-renderer>`;
                }

                if(this._doc.chapters.length > 0) {
                    this.chapters = this._doc.chapters;
                }

                this.chapters.forEach((item) => {
                    this.chapterSidebar += `<div class="submenu-item">Edit ${item.title}</div>`;
                });
            } catch(e) {}
        }
    }

    saveTitle() {
        const updatedTitle = document.querySelector(".document-title").value;
        const documentId = webSkel.registry.currentDocumentId;

        const documentIndex = webSkel.registry.storageData.documents.findIndex(doc => doc.id === documentId);

        if (documentIndex !== -1 && updatedTitle !== webSkel.registry.storageData.documents[documentIndex].name) {
            webSkel.registry.storageData.documents[documentIndex].name=updatedTitle;
            webSkel.registry.updateDocument(documentId, webSkel.registry.storageData.documents[documentIndex]);
            const currentCompany=Company.getInstance();
            currentCompany.companyState.documents[documentIndex].name=updatedTitle;
            currentCompany.notifyObservers();
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

    closeModal(_target) {
        closeModal(_target);
    }

    async showSuggestTitleModal() {
        await showModal(document.querySelector("body"), "suggest-title-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}