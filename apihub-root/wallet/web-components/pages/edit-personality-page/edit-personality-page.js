import {extractFormInformation, constants} from "../../../imports.js";
export class EditPersonalityPage{
    constructor(element,invalidate) {
        this.personality = system.space.getPersonality(window.location.hash.split("/")[3]);
        this.element = element;
        this.invalidate=invalidate;
        this.knowledgeArray = [];
        this.invalidate();
    }

    beforeRender(){
        if(this.personality.name === constants.DEFAULT_PERSONALITY_NAME){
            this.disabled = "disabled";
        }
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
    }

    async showPhoto(photoInput, event) {
        let photoContainer = this.element.querySelector(".personality-photo");
        let encodedPhoto = await system.UI.imageUpload(photoInput.files[0]);
        photoContainer.src = encodedPhoto;
        this.photo = encodedPhoto;
    }

    async search(_target){
        let form = this.element.querySelector(".search");
        let formInfo = await extractFormInformation(form);
        this.knowledgeArray = JSON.parse(await system.space.agent.loadFilteredKnowledge(formInfo.data.search));
        if(this.knowledgeArray.length === 0){
            this.knowledgeArray = ["Nothing found"];
        }
        this.invalidate();
    }

    triggerInputFileOpen(_target, id){
        _target.removeAttribute("data-local-action");
        let input = this.element.querySelector(`#${id}`);
        input.click();
        _target.setAttribute("data-local-action", `triggerInputFileOpen ${id}`);
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
            let flowId = system.space.getFlowIdByName("UpdatePersonality");
            let context = {
                personalityData: personalityData,
                personalityId: this.personality.id
            }
            await system.services.callFlow(flowId, context);
            await this.openPersonalitiesPage();
        }
    }
    async addKnowledge(_target){
        let formInfo = await extractFormInformation(_target);
        let promiseArray = [];
        if(formInfo.isValid){
            for(let file of formInfo.data.files){
                promiseArray.push(await system.UI.uploadFileAsText(file));
            }
            let files = await Promise.all(promiseArray);
            alert("save knowledge TBD")
        }
    }

    async deletePersonality(){
        let flowId = system.space.getFlowIdByName("DeletePersonality");
        let context = {
            personalityId: this.personality.id
        }
        await system.services.callFlow(flowId, context);
        await this.openPersonalitiesPage();
    }

    async openPersonalitiesPage(){
      await system.UI.changeToDynamicPage("space-configs-page", `${system.space.id}/SpaceConfiguration/personalities-page`);
    }
}