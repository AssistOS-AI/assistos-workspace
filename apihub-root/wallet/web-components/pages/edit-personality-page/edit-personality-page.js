import {extractFormInformation} from "../../../imports.js";

export class editPersonalityPage{
    constructor(element,invalidate) {
        let id = window.location.hash.split("/")[2];
        this.personality = webSkel.space.getPersonality(id);
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender(){
       this.personalityName = this.personality.name;
    }

    afterRender(){
        let description = this.element.querySelector("textarea");
        description.value = this.personality.description;
    }

    triggerInputFileOpen(){
        let input = this.element.querySelector(`input[type="file"]`);
        input.click();
    }

    async saveChanges(_target){
        const verifyPhotoSize = (element) => {
            if(element.files.length > 0){
                return element.files[0].size <= 1048576;
            }
            return true;
        };
        const conditions = {"verifyPhotoSize": {fn:verifyPhotoSize, errorMessage:"Image too large! Image max size: 1MB"} };
        let formInfo = await extractFormInformation(_target, conditions);
        if(formInfo.isValid) {
            let personalityData={
                name:formInfo.data.name,
                description:formInfo.data.description,
                image: formInfo.data.photo
            }
            await webSkel.space.updatePersonality(personalityData, this.personality.id);
            await this.openPersonalitiesPage();
        }
    }

    async deletePersonality(){
        await webSkel.space.deletePersonality(this.personality.id);
        await this.openPersonalitiesPage();
    }

    async openPersonalitiesPage(){
      await webSkel.changeToDynamicPage("space-page", "space-page/personalities-page");
    }
}