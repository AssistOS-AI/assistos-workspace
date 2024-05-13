import {constants} from "../../../imports.js";
const spaceAPIs = require("assistos").loadModule("space").loadAPIs();
const {notificationService} = require("assistos").loadModule("util");
export class EditPersonalityPage{
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate=invalidate;
        this.knowledgeArray = [];
        this.refreshPersonality = async ()=>{
            this.personality = await assistOS.space.getPersonality(window.location.hash.split("/")[3]);
        }
        this.invalidate(async ()=>{
            await this.refreshPersonality();
            spaceAPIs.startCheckingUpdates(assistOS.space.id);
            spaceAPIs.subscribeToObject(assistOS.space.id, this.personality.id);
            notificationService.on(this.personality.id, ()=>{
                this.invalidate(this.refreshPersonality);
            });
            notificationService.on(this.personality.id + "/delete", async ()=>{
                await this.openPersonalitiesPage();
                await spaceAPIs.unsubscribeFromObject(assistOS.space.id, this.personality.id);
                spaceAPIs.stopCheckingUpdates(assistOS.space.id);
                alert("The personality has been deleted");
            })
        });
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
    async afterUnload() {
        await spaceAPIs.unsubscribeFromObject(assistOS.space.id, this.personality.id);
        spaceAPIs.stopCheckingUpdates(assistOS.space.id);
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
        let encodedPhoto = await assistOS.UI.imageUpload(photoInput.files[0]);
        photoContainer.src = encodedPhoto;
        this.photo = encodedPhoto;
    }

    async search(_target){
        let form = this.element.querySelector(".search");
        let formInfo = await assistOS.UI.extractFormInformation(form);
        this.knowledgeArray = JSON.parse(await assistOS.space.getAgent().loadFilteredKnowledge(formInfo.data.search));
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
        let formInfo = await assistOS.UI.extractFormInformation(_target, conditions);
        if(formInfo.isValid) {
            this.personality.name = formInfo.data.name;
            this.personality.description = formInfo.data.description;
            this.personality.image = this.photo;
            await assistOS.callFlow("UpdatePersonality", {
                spaceId: assistOS.space.id,
                personalityData: this.personality,
                personalityId: this.personality.id
            });
            await this.openPersonalitiesPage();
        }
    }
    async addKnowledge(_target){
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        let promiseArray = [];
        if(formInfo.isValid){
            for(let file of formInfo.data.files){
                promiseArray.push(await assistOS.UI.uploadFileAsText(file));
            }
            let files = await Promise.all(promiseArray);
            alert("save knowledge TBD")
        }
    }

    async deletePersonality(){
        await assistOS.callFlow("DeletePersonality", {
            spaceId: assistOS.space.id,
            personalityId: this.personality.id
        });
        await this.openPersonalitiesPage();
    }

    async openPersonalitiesPage(){
      await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/Space/personalities-page`);
    }
}