const spaceModule = require("assistos").loadModule("space", {});
const personalityModule = require("assistos").loadModule("personality", {});
export class AddPersonalityModal {
    constructor(element,invalidate) {
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    triggerInputFileOpen(_target){
        _target.removeAttribute("data-local-action");
        let input = this.element.querySelector(`input[type="file"]`);
        input.click();
        _target.setAttribute("data-local-action", "triggerInputFileOpen");
    }

    async addPersonalitySubmitForm(_target) {
        const verifyPhotoSize = (element) => {
            return !element.files[0]? true : element.files[0].size <= 1048576;
        };
        const conditions = {"verifyPhotoSize": {fn:verifyPhotoSize, errorMessage:"Image too large! Image max size: 1MB"} };
        let formInfo = await assistOS.UI.extractFormInformation(_target, conditions);
        if(formInfo.isValid) {
            let reader = new FileReader();
            reader.onload = async (e) => {
                const uint8Array = new Uint8Array(e.target.result);
                let imageId = await spaceModule.putImage(assistOS.space.id, uint8Array);
                let personalityData = {
                    name: formInfo.data.name,
                    description: formInfo.data.description,
                    imageId: imageId,
                    metadata: ["name", "id", "imageId"]
                };
                await personalityModule.addPersonality(assistOS.space.id, personalityData);
                assistOS.UI.closeModal(_target);
                assistOS.space.notifyObservers(assistOS.space.getNotificationId());
            };
            reader.readAsArrayBuffer(formInfo.data.photo);
        }
    }
}