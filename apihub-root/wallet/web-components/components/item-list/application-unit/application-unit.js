import {getClosestParentWithPresenter, refreshElement,decodeBase64} from "../../../../imports.js";

export class applicationUnit{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.installed = false;

        this.appName = this.element.getAttribute("data-name");
        for (let installedApplication of webSkel.currentUser.space.installedApplications) {
            if (installedApplication.name === this.appName) {
                this.installed = true;
            }
        }
        this.applicationImage = decodeBase64(this.element.getAttribute("data-image"));
        this.applicationButtons = "";
        if (this.installed) {
            this.applicationButtons += `<button class="btn btn-primary" data-local-action="uninstallApplication">Uninstall</button>`;
        }else{
            this.applicationButtons += `<button class="btn btn-primary" data-local-action="installApplication">Install</button>`;
        }
    }
    afterRender(){
    }
    async installApplication() {
        const loading = await webSkel.showLoading(`<general-loader></general-loader>`);
        await webSkel.getService("ApplicationsService").installApplication(this.appName);
        loading.close();
        loading.remove();
        window.location="";
    }
    async uninstallApplication() {
        const loading = await webSkel.showLoading(`<general-loader></general-loader>`);
        await webSkel.getService("ApplicationsService").uninstallApplication(this.appName);
        loading.close();
        loading.remove();
        window.location="";
    }

    async navigateToApplicationPage(){
        await webSkel.changeToDynamicPage("application-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/applications/${this.appName}/application-page`);
    }
}