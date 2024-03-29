import {
    showActionBox,
} from "../../../imports.js";

export class CollaboratorsPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        let string = "";
        this.tasksNr = system.space.agent.tasks.length;
        for(let task of system.space.agent.tasks){
            string+= `<div class="task">
                       <div class="description">${task.description}</div> 
                       <div class="date">${task.date}</div>
                      </div>`;
        }
        this.tasks = string;
    }

    search(){
     alert("to be done");
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

}