let userModule = require("assistos").loadModule("user", {}).loadAPIs();
export class GitCredentialsModal {
    constructor(element,invalidate){
        this.invalidate=invalidate;
        this.invalidate();
    }
    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
    beforeRender() {}

    async setCredentials(_target){
        let formData = await assistOS.UI.extractFormInformation(_target);
        if(formData.isValid) {
            await userModule.addGITCredentials(assistOS.space.id, formData.data.username, formData.data.token);
            assistOS.UI.closeModal(_target, true);
        }
    }
}