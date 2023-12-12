export class applicationsMarketplacePage {
    constructor(element, invalidate) {
        this.element=element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.applications = "";
        debugger;
        webSkel.getApplications()?.forEach((application) => {
            for (let installedApplication of webSkel.currentUser.space.installedApplications) {
                if (parseInt(installedApplication.id) === parseInt(application.id)) {
                    return;
                }
            }
            this.applications +=
                `<application-unit data-name="${application.name}" data-image="${application.image}" data-id="${application.id}" data-presenter="application-unit"></application-unit>`
        });
    }
}