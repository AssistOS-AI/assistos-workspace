const {notificationService} = require("assistos").loadModule("util", {});
export class MidjourneyImage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.imageId = this.element.variables["data-image-id"];
        this.parentPresenter = document.querySelector("generate-image-page").webSkelPresenter;
        let image = this.parentPresenter.images.find((image)=> image.messageId === this.imageId);
        this.prompt = image.prompt;
        notificationService.off(this.imageId);
        notificationService.on(this.imageId, (data) => {
            this.setImage(data);
            this.invalidate();
        });
        this.invalidate();
    }
    getImage(){
        return this.parentPresenter.images.find((image)=> image.messageId === this.imageId);
    }
    setImage(data){
        this.parentPresenter.images[this.parentPresenter.images.findIndex((image)=> image.messageId === this.imageId)] = data;
    }
    beforeRender(){
        let buttonsHTML = "";
        this.noStatus = "hidden";
        this.queueStatus = "hidden";
        this.processStatus = "hidden";
        this.doneStatus = "hidden";
        let image = this.getImage();
        if(!image.status){
            this.noStatus = "flex";
            image.buttons = ["Cancel Job"];
        } else if(image.status === "QUEUED"){
            this.queueStatus = "flex";
            image.buttons = ["Cancel Job"];
        } else if(image.status === "PROCESSING"){
            this.barWidth = image.progress + "%";
            this.processStatus = "flex";
            image.buttons = ["Cancel Job"];
        } else if(image.status === "DONE"){
            this.doneStatus = "";
            image.prompt = this.prompt;
            this.imageSrc = image.uri;
        } else if(image.status === "FAILED"){
            showApplicationError("Error generating image", this.image.error,"error");
        }
        for(let action of image.buttons){
            buttonsHTML += `<button class="general-button midjourney-button" data-local-action="editImage ${image.messageId} ${assistOS.UI.sanitize(action)}">${this.parentPresenter.currentModel.buttons[action]}</button>`
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
        let image = this.getImage();
        if(this.parentPresenter.images[this.parentPresenter.images.length - 1] === image){
            this.element.scrollIntoView({behavior: "smooth", block: "end"});
        }
    }
}