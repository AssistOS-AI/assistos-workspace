import {
    showModal,
    showActionBox,
    reverseQuerySelector
} from "../../../imports.js";

export class tasksPage {
    constructor(element, invalidate) {
        this.notificationId = "space:space-page:tasks";
        webSkel.currentUser.space.observeChange(this.notificationId,invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.tableRows = "";

    }

    search(){
     alert("to be done");
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

}