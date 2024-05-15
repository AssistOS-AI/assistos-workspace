export class ApplicationsMarketplacePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.applications = "";
        Object.entries(assistOS.applications).forEach((application) => {
            if(application[1].name === "Imagify" || application[1].name === "MyWebPage"){
                return;
            }
            this.applications +=
                `<application-unit data-name="${application[1].name}" data-presenter="application-unit" data-description="${application[1].description}"></application-unit>`;
        });
    }

    afterRender(){
        this.setContext();
    }
    setContext(){
        assistOS.context = {
            "location and available actions": "We are in the Applications Marketplace page in OS. Here you can see the applications available for the assistOS. Some of them have not been installed yet.",
            "available items": JSON.stringify(assistOS.applications)
        }
    }
    async addMarketplace(){
        await assistOS.UI.showModal( "add-marketplace-modal", { presenter: "add-marketplace-modal"});
    }
}