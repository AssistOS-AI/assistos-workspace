import {showModal} from "../../../imports.js";

export class applicationsMarketplacePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.applications = "";
        Object.entries(webSkel.applications).forEach((application) => {
            this.applications +=
                `<application-unit data-name="${application[1].name}" data-presenter="application-unit" data-description="${application[1].description}"></application-unit>`;
        });
    }
    async addMarketplace(){
        await showModal( "add-marketplace-modal", { presenter: "add-marketplace-modal"});
    }
}