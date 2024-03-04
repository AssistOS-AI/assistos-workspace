import {extractFormInformation} from "../../../imports.js";

export class GitCredentialsModal {
    constructor(element,invalidate){
        this.invalidate=invalidate;
        this.invalidate();
    }
    closeModal(_target) {
        webSkel.closeModal(_target);
    }
    beforeRender() {}

    async setCredentials(_target){
        let formData = await extractFormInformation(_target);
        if(formData.isValid) {
            let usernameSecret = {
                secretName: "username",
                secret: formData.data.username
            }
            let tokenSecret = {
                secretName: "token",
                secret: formData.data.token
            }
            await webSkel.appServices.storeGITCredentials(JSON.stringify(usernameSecret));
            await webSkel.appServices.storeGITCredentials(JSON.stringify(tokenSecret));
            webSkel.closeModal(_target, true);
        }
    }
}