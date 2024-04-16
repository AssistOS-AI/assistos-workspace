import {
    closeModal,
    extractFormInformation
} from "../../../imports.js";


export class AddPersonalityModal {
    constructor(element,invalidate) {
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        closeModal(_target);
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
        let formInfo = await extractFormInformation(_target, conditions);
        if(formInfo.isValid) {
            await assistOS.callFlow("AddPersonality", {
                name: formInfo.data.name,
                description: formInfo.data.description,
                photo: formInfo.data.photo
            });
            assistOS.space.notifyObservers(assistOS.space.getNotificationId());
            closeModal(_target);
        }
    }
}