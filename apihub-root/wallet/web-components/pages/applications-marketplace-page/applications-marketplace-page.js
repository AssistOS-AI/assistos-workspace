import {showModal} from "../../../imports.js";

export class ApplicationsMarketplacePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.applications = "";
        Object.entries(system.applications).forEach((application) => {
            if(application[1].name === "Imagify" || application[1].name === "MyWebPage"){
                return;
            }
            this.applications +=
                `<application-unit data-name="${application[1].name}" data-presenter="application-unit" data-description="${application[1].description}"></application-unit>`;
        });
    }
    expandTable(){
        let table = this.element.querySelector(".marketplace-table");
        table.style.gridTemplateColumns = "repeat(2, 1fr)";
    }
    minimizeTable(){
        let table = this.element.querySelector(".marketplace-table");
        table.style.gridTemplateColumns = "repeat(1, 1fr)";
    }
    afterRender(){
        if(this.boundExpandTable){
            this.element.removeEventListener("hideSidebar", this.boundExpandTable);
        }
        this.boundExpandTable = this.expandTable.bind(this);
        this.element.addEventListener("hideSidebar", this.boundExpandTable);
        if(this.boundMinimizeTable){
            this.element.removeEventListener("showSidebar", this.boundMinimizeTable);
        }
        this.boundMinimizeTable = this.minimizeTable.bind(this);
        this.element.addEventListener("showSidebar", this.boundMinimizeTable);
        this.setContext();
    }
    setContext(){
        system.context = {
            "location and available actions": "We are in the Applications Marketplace page in OS. Here you can see the applications available for the system. Some of them have not been installed yet.",
            "available items": JSON.stringify(system.applications)
        }
    }
    async addMarketplace(){
        await showModal( "add-marketplace-modal", { presenter: "add-marketplace-modal"});
    }
}