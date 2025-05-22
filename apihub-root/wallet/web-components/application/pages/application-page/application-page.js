const applicationModule = assistOS.loadModule("application");
export class ApplicationPage {
    constructor(element, invalidate) {
        this.element=element;
        this.invalidate = invalidate;
        this.invalidate();
        let name = window.location.hash.split("/")[3];
        this._app = assistOS.space.getApplicationByName(name);
    }

    beforeRender() {
        this.appName = this._app.name;
        this.appFlows = "";
        if (this._app.flows.length > 0) {
            this._app.flows.sort(function(a, b) {
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            });
            this._app.flows.forEach((item) => {
                this.appFlows += `<flow-item data-name="${item.name}" data-description="${item.description}" data-local-action="editAction"></flow-item>`;
            });
        } else {
            this.appFlows = `<div class="no-data-loaded">No data loaded</div>`;
        }
        this.description = this._app.description;
        this.installed = false;
        for (let installedApplication of assistOS.space.installedApplications) {
            if (installedApplication.id === this._app.id) {
                this.installed = true;
            }
        }
        this.applicationButtons = "";
        if (this.installed) {
            this.applicationButtons += `<button class="btn btn-primary general-button" data-local-action="uninstallApplication">Uninstall</button>`;
        }else{
            this.applicationButtons += `<button class="btn btn-primary general-button" data-local-action="installApplication">Install</button>`;
        }
        this.orgName = "Axiologic";
        let tags = ["Tools", "Ai"];
        let string = "";
        for(let tag of tags){
            string+=`<div class="tag">${tag}</div>`
        }
        this.tags = string;
    }
    async uninstallApplication() {
        const loadingId = assistOS.UI.showLoading();
        let response = await applicationModule.uninstallApplication(assistOS.space.id, this.appName);
        if (response.status === 401) {
            let confirmation = await assistOS.UI.showModal("git-credentials-modal", true);
            if (confirmation) {
                await this.uninstallApplication();
            }
        } else {
            assistOS.UI.hideLoading(loadingId);
            location.reload();
        }
    }

    async openApplicationsMarketplacePage(){
        await assistOS.UI.changeToDynamicPage("applications-marketplace-page", `${assistOS.space.id}/Space/applications-marketplace-page`);
    }
    getFlowName(_target){
        return assistOS.UI.reverseQuerySelector(_target, "flow-item").getAttribute("data-name");
    }
    async editAction(_target){
        await assistOS.UI.showModal( "edit-flow-modal", { presenter: "edit-flow-modal", name: this.getFlowName(_target), appId: this._app.id});
    }
    async deleteAction(_target){
        this._app.flows = this._app.flows.filter(flow => flow.name !== this.getFlowName(_target));
        await assistOS.callFlow("DeleteFlow", {
            flowName: this.getFlowName(_target),
            appId: this._app.id
        });
        this.invalidate();
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}
