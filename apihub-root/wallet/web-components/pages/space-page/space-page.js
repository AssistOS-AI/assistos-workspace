export class spacePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.tab = window.location.hash.split("/")[1];
    }

    async openTab(_target) {
        let tabName = _target.getAttribute("data-name");

        switch(tabName) {
            case "agents-page":
                this.tab = "agents-page";
                window.location.hash = "#space-page/agents-page";
                break;
            case "announcements-page":
                this.tab = "announcements-page";
                window.location.hash = "#space-page/announcements-page";
                break;
            case "personalities-page":
                this.tab = "personalities-page";
                window.location.hash = "#space-page/personalities-page";
                break;
            case "scripts-page":
                this.tab = "scripts-page";
                window.location.hash = "#space-page/scripts-page";
                break;
            case "tasks-page":
                this.tab = "tasks-page";
                window.location.hash = "#space-page/tasks-page";
                break;
            case "knowledge-page":
                this.tab = "knowledge-page";
                window.location.hash = "#space-page/knowledge-page";
                break;
            case "collaborators-page":
                this.tab = "collaborators-page";
                window.location.hash = "#space-page/collaborators-page";
                break;
        }
        this.invalidate();
    }

    beforeRender() {
     this.spaceName = webSkel.currentUser.space.name;

     switch (this.tab){
         case "agents-page":{
             this.pageContent = `<agents-page data-presenter="agents-page"></agents-page>`;
             break;
         }
         case "announcements-page":{
             this.pageContent = `<announcements-page data-presenter="announcements-page"></announcements-page>`;
             break;
         }
         case "personalities-page":{
             this.pageContent = `<personalities-page data-presenter="personalities-page"></personalities-page>`;
             break;
         }
         case "scripts-page":{
             this.pageContent = `<scripts-page data-presenter="scripts-page"></scripts-page>`;
             break;
         }
         case "tasks-page":{
             this.pageContent = `<tasks-page data-presenter="tasks-page"></tasks-page>`;
             break;
         }
         case "knowledge-page":{
             this.pageContent = `<knowledge-page data-presenter="knowledge-page"></knowledge-page>`;
             break;
         }
         case "collaborators-page":{
             this.pageContent = `<collaborators-page data-presenter="collaborators-page"></collaborators-page>`;
             break;
         }
         default:{
             this.pageContent = `<announcements-page data-presenter="announcements-page"></announcements-page>`;
             window.location.hash = "#space-page/announcements-page";
             this.tab = "announcements-page";
             break;
         }
     }
    }
    afterRender(){
        let selectedTab = this.element.querySelector(`[data-name = '${this.tab}']`);
        selectedTab.classList.add("selected-tab");
    }
}