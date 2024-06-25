const {notificationService} = require("assistos").loadModule("util", {});
export class MidjourneyImage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let imageId = this.element.variables["data-image-id"];
        this.parentPresenter = document.querySelector("generate-image-page").webSkelPresenter;
        this.image = this.parentPresenter.images.find((image)=> image.messageId === imageId);
        this.prompt = this.image.prompt;
        notificationService.off(this.image.messageId);
        notificationService.on(this.image.messageId, (data) => {
            this.image = data;
            this.invalidate();
        });
        this.invalidate();
    }
    beforeRender(){
        let buttonsHTML = "";
        this.noStatus = "hidden";
        this.queueStatus = "hidden";
        this.processStatus = "hidden";
        this.doneStatus = "hidden";
        if(!this.image.status){
            this.noStatus = "flex";
            this.image.buttons = ["Cancel Job"];
        } else if(this.image.status === "QUEUED"){
            this.queueStatus = "flex";
            this.image.buttons = ["Cancel Job"];
        } else if(this.image.status === "PROCESSING"){
            this.barWidth = this.image.progress + "%";
            this.processStatus = "flex";
            this.image.buttons = ["Cancel Job"];
        } else if(this.image.status === "DONE"){
            this.doneStatus = "";
            this.image.prompt = this.prompt;
            this.imageSrc = this.image.uri;
        } else if(this.image.status === "FAILED"){
            showApplicationError("Error generating image", this.image.error,"error");
        }
        for(let action of this.image.buttons){
            buttonsHTML += `<button class="general-button midjourney-button" data-local-action="editImage ${this.image.messageId} ${assistOS.UI.sanitize(action)}">${this.parentPresenter.currentModel.buttons[action]}</button>`
        }
        this.buttons = buttonsHTML;
    }
    afterRender(){
        let imageItem = this.element.querySelector(".image-item");
        let imageCheckbox = imageItem.querySelector(".image-checkbox");
        let imageMenu = imageItem.querySelector(".image-menu");
        imageItem.addEventListener("mouseenter", (event) => {
            imageCheckbox.style.visibility = "visible";
        });
        imageItem.addEventListener("mouseleave", (event) => {
            if (!imageCheckbox.checked) {
                imageCheckbox.style.visibility = "hidden";
            }
        });
        imageCheckbox.addEventListener("change", (event) => {
            if (imageCheckbox.checked) {
                imageMenu.style.visibility = "visible";
            } else {
                imageMenu.style.visibility = "hidden";
            }
        });
        if(this.parentPresenter.images[this.parentPresenter.images.length - 1] === this.image){
            this.element.scrollIntoView({behavior: "smooth", block: "end"});
        }
    }
}