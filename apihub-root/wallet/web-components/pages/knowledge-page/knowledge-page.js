import {
    showModal,
    showActionBox,
    reverseQuerySelector, extractFormInformation
} from "../../../imports.js";

export class knowledgePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.knowledgeArray = [];
    }
    beforeRender() {
        let string = "";
        for(let fact of this.knowledgeArray){
            string+= `<div class="fact">${fact}</div>`;
        }
        this.filteredKnowledge = string;
    }
    preventRefreshOnEnter(event){
        if(event.key === "Enter"){
            event.preventDefault();
            this.element.querySelector(".magnifier-container").click();
        }
    }
    afterRender(){
        this.userInput = this.element.querySelector("#search");
        this.userInput.removeEventListener("keypress", this.boundFn);
        this.boundFn = this.preventRefreshOnEnter.bind(this);
        this.userInput.addEventListener("keypress", this.boundFn);
    }

    async search(_target){
     let form = this.element.querySelector("form");
     let formInfo = await extractFormInformation(form);
     this.knowledgeArray = JSON.parse(await webSkel.currentUser.space.agent.loadFilteredKnowledge(formInfo.data.search));
     if(this.knowledgeArray.length === 0){
         this.knowledgeArray = ["Nothing found"];
     }
     this.invalidate();
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

}