export class AgentItem {
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){

    }
    afterRender(){
        let image = this.element.querySelector(".agent-image");
        image.addEventListener("error", (e)=>{
            e.target.src = "./wallet/assets/images/default-agent.png";
        });
    }
}