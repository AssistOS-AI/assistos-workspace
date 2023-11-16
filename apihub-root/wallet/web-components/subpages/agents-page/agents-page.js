import {parseURL,sanitize} from "../../../imports.js";

export class agentsPage{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){
        this.agents = "";
        webSkel.currentUser.space.agents.forEach((agent)=>{
            this.agents += `<agent-unit data-name="${sanitize(agent.name)}" data-id="${agent.id}" data-local-action="editAgent"></agent-unit>`;
        });
    }
}