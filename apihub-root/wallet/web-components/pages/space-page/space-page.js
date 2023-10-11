export class spacePage {
    constructor(element, invalidate) {
        this.element = element;
        this.pageContent = `<announcements-page data-presenter="announcements-page"></announcements-page>`;
        this.tab = "Announcements";
        this.id1 = "selected-tab";
        this.id2 = "";
        this.id3 = "";
        this.invalidate = invalidate;
        this.invalidate();
    }

    async openTab(_target) {
        let selectedTab = document.getElementById("selected-tab");
        this.tab = _target.querySelector(".tab").innerText;
        if(selectedTab !== _target) {
            switch(selectedTab.querySelector(".tab").innerText) {
                case "Announcements":
                    this.id1 = "";
                    break;
                case "Personalities":
                    this.id2 = "";
                    break;
                case "Scripts":
                    this.id3 = "";
                    break;
            }

            switch(this.tab) {
                case "Announcements":
                    this.pageContent = `<announcements-page data-presenter="announcements-page"></announcements-page>`;
                    this.id1 = "selected-tab";
                    break;
                case "Personalities":
                    this.pageContent = `<personalities-page data-presenter="personalities-page"></personalities-page>`;
                    this.id2 = "selected-tab";
                    break;
                case "Scripts":
                    this.pageContent = `<scripts-page data-presenter="scripts-page"></scripts-page>`;
                    this.id3 = "selected-tab";
                    break;
            }
            this.invalidate();
        }
    }

    beforeRender() {
     this.spaceName = webSkel.space.name;
    }
}