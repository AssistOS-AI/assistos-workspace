import {
    closeModal,
    extractFormInformation
} from "../../../imports.js";


export class addFlowModal {
    constructor(element,invalidate) {
       this.invalidate=invalidate;
       this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        closeModal(_target);
    }

    async addScript(_target) {
        let formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            let flowData = {
                name:formInfo.data.name,
                description: formInfo.data.description,
                id:webSkel.servicesRegistry.UtilsService.generateId(),
                content: formInfo.data.validateCode
            }
            await webSkel.getService("globalFlowsService").spaceFlows.addFlow(flowData);
            webSkel.currentUser.space.notifyObservers(webSkel.currentUser.space.getNotificationId());
            closeModal(_target);
        }
    }
}