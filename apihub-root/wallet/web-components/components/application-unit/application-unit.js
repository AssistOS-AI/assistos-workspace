const applicationModule = require("assistos").loadModule("application");

export class ApplicationUnit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    getApp() {
        for (let name of Object.keys(assistOS.applications)) {
            if (name === this.appName) {
                return assistOS.applications[name];
            }
        }
        return null;
    }

    beforeRender() {
        this.installed = false;
        this.appName = this.element.getAttribute("data-name");
        this.app = this.getApp();
        for (let installedApplication of assistOS.space.installedApplications) {
            if (installedApplication.name === this.appName) {
                this.installed = true;
            }
        }
        //this.description = this.element.getAttribute("data-description");
        this.description = this.app.description;
        this.appImage = this.app.image;
        this.applicationButtons = "";
        if (this.installed) {
            this.applicationButtons += `<button class="general-button uninstall" data-local-action="uninstallApplication">Uninstall</button>`;
        } else {
            this.applicationButtons += `<button class="general-button" data-local-action="installApplication">Install</button>`;
        }
    }

    afterRender() {
    }

    async installApplication() {
        await applicationModule.installApplication(assistOS.space.id, this.appName);
        location.reload();
    }

    async uninstallApplication() {
        await applicationModule.uninstallApplication(assistOS.space.id, this.appName);
        location.reload();
    }

    async navigateToApplicationPage() {
        if (this.installed) {
            await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/Space/application-page/${this.appName}`);
        }
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async cloneAction() {
        console.log("to be done");
    }
}