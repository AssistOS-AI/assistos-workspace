import {getClosestParentWithPresenter, refreshElement,decodeBase64} from "../../../../imports.js";

export class applicationUnit{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.installed = false;

        this.id = this.element.getAttribute("data-id");
        for (let installedApplication of webSkel.currentUser.space.installedApplications) {
            if (installedApplication.id === this.id) {
                this.installed = true;
            }
        }
        this.applicationImage = decodeBase64(this.element.getAttribute("data-image"));
        this.applicationButtons = "";
        if (this.installed) {
            this.applicationButtons += `<button class="btn btn-primary" data-local-action="uninstallApplication">Uninstall</button>`;
            this.applicationButtons += `<button class="btn btn-primary" data-local-action="reinstallApplication">Reinstall</button>`;
        }else{
            this.applicationButtons += `<button class="btn btn-primary" data-local-action="installApplication">Install</button>`;
        }
    }
    afterRender(){
    }
    async installApplication() {
        const loading = await webSkel.showLoading(`<general-loader></general-loader>`);
        await storageManager.installApplication(webSkel.currentUser.space.id, this.id);
        loading.close();
        loading.remove();
        window.location="";
    }
    async uninstallApplication() {
        const loading = await webSkel.showLoading(`<general-loader></general-loader>`);
        await storageManager.uninstallApplication(webSkel.currentUser.space.id, this.id);
        loading.close();
        loading.remove();
        window.location="";
    }
    async reinstallApplication() {
        const loading = await webSkel.showLoading(`<general-loader></general-loader>`);
        await storageManager.reinstallApplication(webSkel.currentUser.space.id, this.id);
        loading.close();
        loading.remove();
        window.location="";
    }

    async navigateToApplicationPage(){
        await webSkel.changeToDynamicPage("application-page", `space/applications-marketplace-page/application-page/${this.id}`);
    }
}