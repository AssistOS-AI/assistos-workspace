import {showModal} from "../../../imports.js";

export class ApplicationsMarketplacePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.applications = "";
        Object.entries(webSkel.applications).forEach((application) => {
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
    }
    async addMarketplace(){
        await showModal( "add-marketplace-modal", { presenter: "add-marketplace-modal"});
    }
}