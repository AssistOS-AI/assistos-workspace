import {showActionBox} from "../../../imports.js";

export class ApplicationUnit{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    getApp() {
        for (let name of Object.keys(webSkel.applications)) {
            if (name === this.appName) {
                return webSkel.applications[name];
            }
        }
        return null; // Object not found
    }
    beforeRender() {
        this.installed = false;
        this.appName = this.element.getAttribute("data-name");
        this.app = this.getApp();
        for (let installedApplication of webSkel.currentUser.space.installedApplications) {
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
        }else{
            this.applicationButtons += `<button class="general-button" data-local-action="installApplication">Install</button>`;
        }
    }
    afterRender(){
    }
    async installApplication() {
        const loadingId = await webSkel.showLoading();
        let response = await webSkel.appServices.installApplication(this.appName);
        if(response.status === 404)    {
           let confirmation = await webSkel.showModal("git-credentials-modal", true);
           if(confirmation){
               await this.installApplication();
           }
        }else {
            webSkel.hideLoading(loadingId);
            location.reload();
        }
    }
    async uninstallApplication() {
        const loadingId = await webSkel.showLoading();
        let response = await webSkel.appServices.uninstallApplication(this.appName);
        if(response.status === 404){
            let confirmation = await webSkel.showModal("git-credentials-modal", true);
            if(confirmation){
                await this.uninstallApplication();
            }
        }else {
            webSkel.hideLoading(loadingId);
            location.reload();
        }
    }

    async navigateToApplicationPage(){
        if(this.installed){
            await webSkel.changeToDynamicPage("space-configs-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/application-page/${this.appName}`);
        }
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async cloneAction(){
        console.log("to be done");
    }
}