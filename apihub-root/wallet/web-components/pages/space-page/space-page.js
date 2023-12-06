export class spacePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.tab = window.location.hash.split("/")[1];
    }

    async openTab(_target) {
        let tabName = _target.getAttribute("data-name");
        const agents = "agents-page", announcements = "announcements-page", personalities = "personalities-page",
            flows = "flows-page", tasks = "tasks-page", knowledge = "knowledge-page", collaborators = "collaborators-page",
            settings = "settings-page";
        switch(tabName) {
            case agents:
                this.tab = agents;
                window.location.hash = `#space-page/${agents}`;
                break;
            case announcements:
                this.tab = announcements;
                window.location.hash = `#space-page/${announcements}`;
                break;
            case personalities:
                this.tab = personalities;
                window.location.hash = `#space-page/${personalities}`;
                break;
            case flows:
                this.tab = flows;
                window.location.hash = `#space-page/${flows}`;
                break;
            case tasks:
                this.tab = tasks;
                window.location.hash = `#space-page/${tasks}`;
                break;
            case knowledge:
                this.tab = knowledge;
                window.location.hash = `#space-page/${knowledge}`;
                break;
            case collaborators:
                this.tab = collaborators;
                window.location.hash = `#space-page/${collaborators}`;
                break;
            case settings:
                this.tab = settings;
                window.location.hash = `#space-page/${settings}`;
                break;
        }
        this.invalidate();
    }

    beforeRender() {
     this.spaceName = webSkel.currentUser.space.name;
     const agents = "agents-page", announcements = "announcements-page", personalities = "personalities-page",
        flows = "flows-page", tasks = "tasks-page", knowledge = "knowledge-page", collaborators = "collaborators-page",
        settings = "settings-page";
     switch (this.tab){
         case agents:{
             this.pageContent = `<${agents} data-presenter="${agents}"></${agents}>`;
             break;
         }
         case announcements:{
             this.pageContent = `<${announcements} data-presenter="${announcements}"></${announcements}>`;
             break;
         }
         case personalities:{
             this.pageContent = `<${personalities} data-presenter="${personalities}"></${personalities}>`;
             break;
         }
         case flows:{
             this.pageContent = `<${flows} data-presenter="${flows}"></${flows}>`;
             break;
         }
         case tasks:{
             this.pageContent = `<${tasks} data-presenter="${tasks}"></${tasks}>`;
             break;
         }
         case knowledge:{
             this.pageContent = `<${knowledge} data-presenter="${knowledge}"></${knowledge}>`;
             break;
         }
         case collaborators:{
             this.pageContent = `<${collaborators} data-presenter="${collaborators}"></${collaborators}>`;
             break;
         }
         case settings:{
             this.pageContent = `<${settings} data-presenter="${settings}"></${settings}>`;
             break;
         }
         default:{
             this.pageContent = `<${announcements} data-presenter="${announcements}"></${announcements}>`;
             window.location.hash = `#space-page/${announcements}`;
             this.tab = announcements;
             break;
         }
     }
    }
    afterRender(){
        let selectedTab = this.element.querySelector(`[data-name = '${this.tab}']`);
        selectedTab.classList.add("selected-tab");
    }
}