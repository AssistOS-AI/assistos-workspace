import { Company } from "../core/company.js";
import { showModal } from "../../WebSkel/utils/modal-utils.js";

export class editTitlePage {
    constructor() {
        this.title = "Current Title";
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
        let documentContent = document.querySelector("edit-title-page");
        this.id = parseInt(documentContent.getAttribute("data-document-id"));
        this.alternativeTitles = "";
        if(this._documentConfigs) {
            this._doc = this._documentConfigs.find(document => document.id === this.id);
            try {
                this.title = this._doc.name;
                let suggestedTitle = "Bees are nature's little pollination superheroes! Let's protect them and ensure our food chain thrives. #SaveTheBees";
                for(let number = 1; number <= 10; number++) {
                    this.alternativeTitles += `<alternative-title-renderer nr="${number}" title="${suggestedTitle}"></alternative-title-renderer>`;
                }
                this._doc.chapters.forEach((item) => {
                    this.chapterSidebar += `<div class="submenu-item">Edit ${item.name}</div>`;
                });
            } catch(e) {}
        }
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {
        const editTitleButton = document.querySelector('#edit-title');
        editTitleButton.addEventListener('click', () => {
            webSkel.changeToStaticPage(`documents/${this.id}/edit-title`);
        });

        const editAbstractButton = document.querySelector('#edit-abstract');
        editAbstractButton.addEventListener('click', () => {
            webSkel.changeToStaticPage(`documents/${this.id}/edit-abstract`);
        });

        const chapterSubmenuSection = document.querySelector(".sidebar-submenu");
        const editChapterButton = document.querySelector('#edit-chapter');
        editChapterButton.addEventListener('click', () => {
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
        });

        const settingsButton = document.querySelector('#settings');
        settingsButton.addEventListener('click', () => {
            webSkel.changeToStaticPage(`documents/${this.id}/settings`);
        });

        const brainstormingButton = document.querySelector('#brainstorming');
        brainstormingButton.addEventListener('click', () => {
            webSkel.changeToStaticPage(`documents/${this.id}/brainstorming`);
        });

        let modalSection = document.querySelector("[data-local-action]");
        modalSection.addEventListener("click", async (event) => {
            await showModal(document.querySelector("body"), "suggest-title-modal", {});
        });
    }
}