import {showModal} from "../../../../../WebSkel/utils/modal-utils";

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
        this.spaceGraph = JSON.stringify(this.graph, null, 2);
        this.errors = await spaceModule.getErrorsFromLastBuild(assistOS.space.id);
        this.buildErrors = JSON.stringify(this.errors);
        let variablesHTML = "";
        for (let variable of this.variables) {
            variablesHTML +=
                `<div class="cell">${variable.varName}</div>
                 <div class="cell">${variable.varId}</div>
                 <div class="cell">${variable.value}</div>
                 <div class="cell pointer details" data-local-action="showDetails ${variable.id}">.........</div>`;
        }
        this.variablesHTML = variablesHTML;
    }
    afterRender(){
        let buildCheckbox = this.element.querySelector("#automaticBuild");
        buildCheckbox.addEventListener("change", ()=>{
            alert("TO BE DONE");
        });
    }
    async buildAll(button){
        button.classList.add("disabled");
        try {
            await spaceModule.buildAll(assistOS.space.id);
            await assistOS.showToast("Build successful", "success", 5000);
        } catch (e) {
            await assistOS.showToast("Build failed", "error", 5000);
            this.invalidate();
        } finally {
            button.classList.remove("disabled");
        }
    }
    async showDetails(_eventTarget, variableId) {
        // await showModal("variable-details", {
        //     "variable-id": variableId
        // })
    }
}