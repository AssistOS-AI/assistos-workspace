const applicationModule = require("assistos").loadModule("application", {});

export class ApplicationItem {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.pagePresenter = this.element.closest("applications-marketplace-page").webSkelPresenter;
        this.invalidate();
    }

    getApp() {
        return this.pagePresenter.apps.find(app => app.name === this.appName);
    }

    async beforeRender() {
        this.installed = false;
        this.appName = this.element.getAttribute("data-name");
        this.app = this.getApp();
        assistOS.space.applications.find(app => app.name === this.appName) ? this.installed = true : this.installed = false;
        if (this.installed) {
            this.requiresUpdate = await applicationModule.requiresUpdate(assistOS.space.id, this.appName);
        }
        this.appImage = this.app.image;
        this.description = "application description";
        this.applicationButtons = `<div class='application-buttons'>
            ${this.installed ? `
                <div class="app-button pointer uninstall" data-local-action="uninstallApplication">Uninstall</div>
                <div class="app-button pointer update" data-local-action="updateApplication" ${this.requiresUpdate ? "" : "disabled"}>Update</div>
            ` : `
                <div class="app-button pointer" data-local-action="installApplication">Install</div>`}
        </div>
    `;
    }

    async afterRender() {
    }

    async updateApplication(_target) {
        await assistOS.loadifyFunction(async (spaceId, appName) => {
            await applicationModule.updateApplication(spaceId, appName);
            this.invalidate();
        }, assistOS.space.id, this.appName);

    }

    async installApplication() {
        /* create a modal to ask for confirmation */
        try {
            await assistOS.loadifyFunction(async (spaceId, appName) => {
                await applicationModule.installApplication(spaceId, appName);
            }, assistOS.space.id, this.appName)
            location.reload();
        } catch (e) {
            await showApplicationError("Failed to install application", assistOS.UI.sanitize(e.message), "");
        }

    }

    async uninstallApplication() {
        await applicationModule.uninstallApplication(assistOS.space.id, this.appName);
        location.reload();
    }

    async navigateToApplicationPage() {
        if (this.installed) {
            await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/application-page/${this.appName}`);
        }
    }
}