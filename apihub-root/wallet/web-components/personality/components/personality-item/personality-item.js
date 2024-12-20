export class PersonalityItem{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){

    }
    afterRender(){
        let image = this.element.querySelector(".personality-image");
        image.addEventListener("error", (e)=>{
            e.target.src = "./wallet/assets/images/default-personality.png";
        });
    }
}