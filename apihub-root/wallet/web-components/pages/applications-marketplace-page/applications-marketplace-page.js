export class applicationsMarketplacePage{
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.applications="";
        debugger;
        webSkel.getApplications()?.forEach((application) => {
            this.applications+=
                `<application-unit data-name="${application.name}" data-image="${application.image}" data-id="${application.id}" data-presenter="application-unit"></application-unit>`
        });
    }
}