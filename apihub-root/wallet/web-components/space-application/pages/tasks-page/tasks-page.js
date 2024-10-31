export class TasksPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        let string = "";
        // this.tasksNr = assistOS.space.getAgent().tasks.length;
        // for(let task of assistOS.space.getAgent().tasks){
        //     string+= `<div class="task">
        //                <div class="description">${task.description}</div>
        //                <div class="date">${task.date}</div>
        //               </div>`;
        // }
        // this.tasks = string;
    }
    afterRender(){
        this.setContext();
    }
    setContext(){
        assistOS.context = {
            "location and available actions": "We are in the Tasks page in OS. Here you can see tasks that are ongoing, cancelled or done in the assistOS.",
        }
    }
    search(){
     alert("to be done");
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

}