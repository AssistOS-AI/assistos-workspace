export class applicationsMarketplacePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.applications = "";
        this.installedApplications = "";
        webSkel.getApplications()?.forEach((application) => {
            let isInstalled = false;
            for (let installedApplication of webSkel.currentUser.space.installedApplications) {
                if (installedApplication.applicationId === application.id) {
                    this.installedApplications +=
                        `<application-unit data-name="${application.name}" data-image="${application.encodedSvg}" data-id="${application.id}" data-presenter="application-unit" data-installed="true"></application-unit>`;
                    isInstalled = true;
                }
            }
            if (isInstalled === false) {
                this.applications +=
                    `<application-unit data-name="${application.name}" data-image="${application.encodedSvg}" data-id="${application.id}" data-presenter="application-unit" data-installed="false"></application-unit>`
            }

        });
    }
}