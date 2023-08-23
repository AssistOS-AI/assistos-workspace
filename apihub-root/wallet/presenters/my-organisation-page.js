import { Company } from "../core/company.js";
import { showModal } from "../../WebSkel/utils/modal-utils.js";

export class myOrganisationPage {
    constructor() {
        this.modal = "showAddAnnounceModal";
        this.button = "Add announce";
        let currentCompany= Company.getInstance();
        setTimeout(async ()=> {
            this._announceConfigs = await currentCompany.companyState.announces;
            this.invalidate();
        },0);
        currentCompany.onChange((companyState) => {
            this._announceConfigs = companyState.announces;
            this.invalidate();
        });
    }

    beforeRender() {

    }
    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {
        let modalSection = document.querySelector("[data-local-action]");
        modalSection.addEventListener("click", async (event) => {
            await showModal(document.querySelector("body"), "add-announce-modal", {});
        });
    }
}