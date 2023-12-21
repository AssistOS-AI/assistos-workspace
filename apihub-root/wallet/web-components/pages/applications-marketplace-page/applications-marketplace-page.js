export class applicationsMarketplacePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.applications = "";
        webSkel.getApplications()?.forEach((application) => {
            this.applications +=
                `<application-unit data-name="${application.name}" data-image="${application.encodedSvg}" data-presenter="application-unit"></application-unit>`
        });
    }
}