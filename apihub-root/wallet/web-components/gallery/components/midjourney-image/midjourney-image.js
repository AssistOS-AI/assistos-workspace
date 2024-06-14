export class MidjourneyImage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let imageId = this.element.variables["data-image-id"];
        this.parentPresenter = document.querySelector("generate-image-page").webSkelPresenter;
        this.image = this.parentPresenter.images.find((image)=> image.messageId === imageId);
        this.invalidate();
    }
    beforeRender(){
        this.imageSrc = this.image.uri;
        let buttonsHTML = "";
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