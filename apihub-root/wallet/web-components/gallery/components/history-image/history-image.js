const utilModule = require("assistos").loadModule("util", {});
const galleryModule = require("assistos").loadModule("gallery", {});
export class HistoryImage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.imageId = this.element.getAttribute("data-id");
        this.hasButtons = (this.element.getAttribute("data-has-buttons") === "true");
        this.parentPresenter = document.querySelector("generate-image-page").webSkelPresenter;
        let image = this.parentPresenter.images.find((image)=> image.id === this.imageId);
        this.prompt = image.prompt;
        this.invalidate(async ()=>{
            if(image.status !== "DONE") {
                await utilModule.subscribeToObject(this.imageId, async (buttons) => {
                    let imgSrc = "/spaces/images/" + assistOS.space.id + "/" + this.imageId;
                    let image = this.getImage();
                    image.status = "DONE";
                    image.src = imgSrc;
                    if(buttons){
                        image.buttons = buttons;
                    }
                    await galleryModule.updateOpenAIHistoryImage(assistOS.space.id, this.parentPresenter.id, this.imageId, image);
                    await utilModule.unsubscribeFromObject(this.imageId);
                    this.invalidate();
                });
            }
        });
    }
    getImage(){
        return this.parentPresenter.images.find((image)=> image.id === this.imageId);
    }
    setImage(data){
        this.parentPresenter.images[this.parentPresenter.images.findIndex((image)=> image.id === this.imageId)] = data;
    }
    beforeRender(){
        let buttonsHTML = "";
        this.type = "openAI";
        this.noStatus = "hidden";
        this.queueStatus = "hidden";
        this.processStatus = "hidden";
        this.doneStatus = "hidden";
        let image = this.getImage();
        if(!image.status){
            this.noStatus = "flex";
            //image.buttons = ["Cancel Job"];
        } else if(image.status === "QUEUED"){
            this.queueStatus = "flex";
            //image.buttons = ["Cancel Job"];
        } else if(image.status === "PROCESSING"){
            this.barWidth = image.progress + "%";
            this.processStatus = "flex";
            //image.buttons = ["Cancel Job"];
        } else if(image.status === "DONE"){
            this.imgSrc = image.src;
            this.doneStatus = "";
            image.prompt = this.prompt;
        } else if(image.status === "FAILED"){
            showApplicationError("Error generating image", image.error,"error");
        }
        if(this.hasButtons){
            this.type = "midjourney";
            for(let action of image.buttons){
                buttonsHTML += `<button class="general-button midjourney-button" data-local-action="editImage ${image.messageId} ${assistOS.UI.sanitize(action)}">${this.parentPresenter.currentModel.buttons[action]}</button>`
            }
            this.buttons = buttonsHTML;
        }
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