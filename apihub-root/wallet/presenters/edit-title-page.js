import { Company } from "../core/company.js";
import { showModal } from "../../WebSkel/utils/modal-utils.js";

export class editTitlePage {
    constructor() {
         let currentCompany = Company.getInstance();
        setTimeout(async ()=> {
            this._documentConfigs = await currentCompany.companyState.documents;
            this.invalidate();
        },0);
        currentCompany.onChange(async (companyState) => {
            this._documentConfigs = await companyState.documents;
            this.invalidate();
        });
    }

    beforeRender() {
        let documentContent = document.querySelector("edit-title-page");
        this.primaryKey = documentContent.getAttribute("data-document-id");
        this.alternativeTitles = "";
        if(this._documentConfigs) {
            this._doc = this._documentConfigs.find(document => document.primaryKey === this.primaryKey);
            try {
                this.title = this._doc.name;
                let suggestedTitle = "Bees are nature's little pollination superheroes! Let's protect them and ensure our food chain thrives. #SaveTheBees";
                for(let number = 1; number <= 10; number++) {
                    this.alternativeTitles += `<alternative-title-renderer nr="${number}" title="${suggestedTitle}"></alternative-title-renderer>`;
                }
            } catch(e) {}
        }
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {
        const editTitleButton = document.querySelector('#edit-title');
        editTitleButton.addEventListener('click', () => {
            webSkel.changeToStaticPage(`documents/${this.primaryKey}/edit-title`);
        });

        const editAbstractButton = document.querySelector('#edit-abstract');
        editAbstractButton.addEventListener('click', () => {
            webSkel.changeToStaticPage(`documents/${this.primaryKey}/edit-abstract`);
        });

        const settingsButton = document.querySelector('#settings');
        settingsButton.addEventListener('click', () => {
            webSkel.changeToStaticPage(`documents/${this.primaryKey}/settings`);
        });

        let modalSection = document.querySelector("[data-local-action]");
        modalSection.addEventListener("click", async (event) => {
            await showModal(document.querySelector("body"), "suggest-title-modal", {});
        });
    }
}