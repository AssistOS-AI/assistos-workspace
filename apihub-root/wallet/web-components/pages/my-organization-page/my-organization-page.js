export class myOrganizationPage {
    constructor(element) {
        this.element = element;
        this.pageContent = `<announcements-page data-presenter="announcements-page"></announcements-page>`;
        this.tab = "Announcements";
        this.id1 = "selected-tab";
        this.id2 = "";
        this.id3 = "";
        this.id4 = "";
        this.id5 = "";
            setTimeout(()=> {
                this.invalidate();
            }, 0);

        this.updateState = ()=> {
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

   async openTab(_target) {
        let selectedTab = document.getElementById("selected-tab");
        this.tab = _target.querySelector(".tab").innerText;
        if(selectedTab !== _target) {
            switch(selectedTab.querySelector(".tab").innerText) {
                case "Announcements":
                    this.id1 = "";
                    break;
                case "Users":
                    this.id2 = "";
                    break;
                case "Personalities":
                    this.id3 = "";
                    break;
                case "LLMs":
                    this.id4 = "";
                    break;
                case "Scripts":
                    this.id5 = "";
                    break;
            }

            switch(this.tab) {
                case "Announcements":
                    this.pageContent = `<announcements-page data-presenter="announcements-page"></announcements-page>`;
                    this.id1 = "selected-tab";
                    break;
                case "Users":
                    this.pageContent = `<users-page data-presenter="users-page"></users-page>`;
                    this.id2 = "selected-tab";
                    break;
                case "Personalities":
                    this.pageContent = `<personalities-page data-presenter="personalities-page"></personalities-page>`;
                    this.id3 = "selected-tab";
                    break;
                case "LLMs":
                    this.pageContent = `<llms-page data-presenter="llms-page"></llms-page>`;
                    this.id4 = "selected-tab";
                    break;
                case "Scripts":
                    this.pageContent = `<scripts-page data-presenter="scripts-page"></scripts-page>`;
                    this.id5 = "selected-tab";
                    await webSkel.company.settings.getScripts();
                    break;
            }
            this.invalidate();
        }
    }

    beforeRender() {

    }
}