const spaceModule = require("assistos").loadModule("space", {});
export class BuildPage {
    constructor(element,invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    async beforeRender(){
        this.graph = await spaceModule.getGraph(assistOS.space.id);
        this.variables = await spaceModule.getVariables(assistOS.space.id);
    }
    afterRender(){
        let buildCheckbox = this.element.querySelector("#automaticBuild");
        buildCheckbox.addEventListener("change", ()=>{
            alert("TO BE DONE");
        });
    }
    async buildAll(){
        await spaceModule.buildAll(assistOS.space.id);
    }
}