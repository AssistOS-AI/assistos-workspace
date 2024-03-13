import {extractFormInformation} from "../../../imports.js";

export class EditPersonalityPage{
    constructor(element,invalidate) {
        this.personality = webSkel.currentUser.space.getPersonality(window.location.hash.split("/")[3]);
        this.element = element;
        this.invalidate=invalidate;
        this.knowledgeArray = [];
        this.invalidate();
    }

    beforeRender(){
        if(this.personality.image){
            this.photo = this.personality.image;
        } else {
            this.photo = "./wallet/assets/images/default-personality.png";
        }
        this.personalityName = this.personality.name;
        let string = "";
        for(let fact of this.knowledgeArray){
            string+= `<div class="fact">${fact}</div>`;
        }
        this.filteredKnowledge = string;
    }
    preventRefreshOnEnter(event){
        if(event.key === "Enter"){
            event.preventDefault();
            this.element.querySelector(".magnifier-container").click();
        }
    }

    afterRender(){
        let description = this.element.querySelector("textarea");
        description.value = this.personality.description;
        this.userInput = this.element.querySelector("#search");
        this.userInput.removeEventListener("keypress", this.boundFn);
        this.boundFn = this.preventRefreshOnEnter.bind(this);
        this.userInput.addEventListener("keypress", this.boundFn);

        let photoInput = this.element.querySelector("#photo");
        if(this.boundShowPhoto){
            photoInput.removeEventListener("input", this.boundShowPhoto);
        }
        this.boundShowPhoto =  this.showPhoto.bind(this, photoInput)
        photoInput.addEventListener("input", this.boundShowPhoto);
        photoInput.click();
    }

    async showPhoto(photoInput, event) {
        let photoContainer = this.element.querySelector(".personality-photo");
        let encodedPhoto = await webSkel.imageUpload(photoInput.files[0]);
        photoContainer.src = encodedPhoto;
        this.photo = encodedPhoto;
    }

    async search(_target){
        let form = this.element.querySelector(".search");
        let formInfo = await extractFormInformation(form);
        this.knowledgeArray = JSON.parse(await webSkel.currentUser.space.agent.loadFilteredKnowledge(formInfo.data.search));
        if(this.knowledgeArray.length === 0){
            this.knowledgeArray = ["Nothing found"];
        }
        this.invalidate();
    }

    triggerInputFileOpen(_target){
        _target.removeAttribute("data-local-action");
        let input = this.element.querySelector(`input[type="file"]`);
        input.click();
        _target.setAttribute("data-local-action", "triggerInputFileOpen");
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
            let flowId = webSkel.currentUser.space.getFlowIdByName("UpdatePersonality");
            await webSkel.appServices.callFlow(flowId, personalityData, this.personality.id);
            await this.openPersonalitiesPage();
        }
    }

    async deletePersonality(){
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeletePersonality");
        await webSkel.appServices.callFlow(flowId, this.personality.id);
        await this.openPersonalitiesPage();
    }

    async openPersonalitiesPage(){
      await webSkel.changeToDynamicPage("space-configs-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/personalities-page`);
    }
}