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
        }
        this.invalidate();
    }

    beforeRender() {
     this.spaceName = webSkel.space.name;

     switch (this.tab){
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