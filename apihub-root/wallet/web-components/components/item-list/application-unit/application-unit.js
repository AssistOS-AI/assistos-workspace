import {getClosestParentWithPresenter, refreshElement,decodeBase64} from "../../../../imports.js";

export class applicationUnit{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.applicationImage = decodeBase64(this.element.getAttribute("data-image"));
        this.applicationButtons = "";
        if (this.element.getAttribute("data-installed") === "true") {
            this.applicationButtons += `<button class="btn btn-primary" data-local-action="uninstallApplication">Uninstall</button>`;
            this.applicationButtons += `<button class="btn btn-primary" data-local-action="reinstallApplication">Reinstall</button>`;
        }else{
            this.applicationButtons += `<button class="btn btn-primary" data-local-action="installApplication">Install</button>`;
        }
    }
    async installApplication() {
        const loading = await webSkel.showLoading(`<general-loader></general-loader>`);
        await webSkel.getService("ApplicationsService").installApplication(webSkel.currentUser.space.id, this.element.getAttribute("data-id"));
        loading.close();
        loading.remove();
        window.location="";
    }
    async uninstallApplication() {
        const loading = await webSkel.showLoading(`<general-loader></general-loader>`);
        await webSkel.getService("ApplicationsService").uninstallApplication(webSkel.currentUser.space.id, this.element.getAttribute("data-id"));
        loading.close();
        loading.remove();
        window.location="";
    }
    async reinstallApplication() {
        const loading = await webSkel.showLoading(`<general-loader></general-loader>`);
        await webSkel.getService("ApplicationsService").reinstallApplication(webSkel.currentUser.space.id, this.element.getAttribute("data-id"));
        loading.close();
        loading.remove();
        window.location="";
    }
}