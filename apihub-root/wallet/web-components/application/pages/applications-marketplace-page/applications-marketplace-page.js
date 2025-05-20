const applicationModule = require("assistos").loadModule("application", {});
export class ApplicationsMarketplacePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    async beforeRender() {
        this.applications = "";
        this.apps = await applicationModule.getAvailableApps(assistOS.space.id);
        Object.entries(this.apps).forEach((application) => {
            this.applications +=
                `<application-item data-name="${application[1].name}" data-presenter="application-item" data-description="${application[1].description}"></application-item>`;
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

}