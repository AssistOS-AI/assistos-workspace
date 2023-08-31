import { Company } from "../../core/company.js";
import { showModal } from "../../../WebSkel/utils/modal-utils.js";

export class editAbstractPage {
    constructor() {
        this.abstractText = "Lorem ipsum dolor sit amet, id his dolore facilisis, latine recteque vim cu. Mea eu dicant habemus partiendo, ea vidit copiosae mel, vis ne etiam ponderum. Delenit blandit cum no, id vel zril detraxit, etiam salutandi ea eam. Nec an omnis forensibus, eu civibus singulis aliquando est. Augue maluisset pri ut, ut dicat percipitur theophrastus sea. Ne vix debet copiosae, ne persius pertinax delicatissimi mea.";

        let currentCompany = Company.getInstance();

        this.chapterSidebar = "";
        this.showChaptersInSidebar = 0;
        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            console.log(this._documentConfigs.length);
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
        let documentContent = document.querySelector("edit-abstract-page");
        if(documentContent) {
            this.id = parseInt(documentContent.getAttribute("data-document-id"));
        }
        this.alternativeAbstracts = "";
        if(this._documentConfigs) {
            this._doc = this._documentConfigs.find(document => document.id === this.id);
            try {
                this.title = this._doc.name;
                this.abstractText = this._doc.abstract;
                let suggestedTitle = "Bees are nature's little pollination superheroes! Let's protect them and ensure our food chain thrives. #SaveTheBees";
                for(let number = 1; number <= 10; number++) {
                    this.alternativeAbstracts += `<alternative-abstract-renderer nr="${number}" title="${suggestedTitle}"></alternative-abstract-renderer>`;
                }
                this._doc.chapters.forEach((item) => {
                    this.chapterSidebar += `<div class="submenu-item">Edit ${item.name}</div>`;
                });
            } catch(e) {}
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

    async showSuggestAbstractModal() {
        await showModal(document.querySelector("body"), "suggest-abstract-modal", {});
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}