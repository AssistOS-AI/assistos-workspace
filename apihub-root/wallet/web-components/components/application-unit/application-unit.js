import {showActionBox} from "../../../imports.js";

export class ApplicationUnit{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    getApp() {
        for (let name of Object.keys(system.applications)) {
            if (name === this.appName) {
                return system.applications[name];
            }
        }
        return null; // Object not found
    }
    beforeRender() {
        this.installed = false;
        this.appName = this.element.getAttribute("data-name");
        this.app = this.getApp();
        for (let installedApplication of system.space.installedApplications) {
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
        const loadingId = await system.UI.showLoading();
        let response = await system.services.installApplication(this.appName);
        if(response.status === 404)    {
           let confirmation = await system.UI.showModal("git-credentials-modal", true);
           if(confirmation){
               await this.installApplication();
           }
        }else {
            system.UI.hideLoading(loadingId);
            location.reload();
        }
    }
    async uninstallApplication() {
        const loadingId = await system.UI.showLoading();
        let response = await system.services.uninstallApplication(this.appName);
        if(response.status === 404){
            let confirmation = await system.UI.showModal("git-credentials-modal", true);
            if(confirmation){
                await this.uninstallApplication();
            }
        }else {
            system.UI.hideLoading(loadingId);
            location.reload();
        }
    }

    async navigateToApplicationPage(){
        if(this.installed){
            await system.UI.changeToDynamicPage("space-configs-page", `${system.space.id}/SpaceConfiguration/application-page/${this.appName}`);
        }
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async cloneAction(){
        console.log("to be done");
    }
}