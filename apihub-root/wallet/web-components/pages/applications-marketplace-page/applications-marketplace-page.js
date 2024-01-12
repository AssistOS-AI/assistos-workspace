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
                `<application-unit data-name="${application[1].name}" data-image="${application[1].encodedSvg}" data-presenter="application-unit"></application-unit>`
        });
    }
}