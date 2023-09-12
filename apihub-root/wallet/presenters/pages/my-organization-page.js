export class myOrganizationPage {
    constructor(element) {
        this.element = element;
        this.pageContent = `<announces-page data-presenter="announces-page"></announces-page>`;
        this.tab = "Announces";
        this.id1 = "selected-tab";
        this.id2 = "";
        this.id3 = "";
        this.id4 = "";
        this.id = webSkel.company.currentDocumentId;
        if(webSkel.company.documents) {
            this._documentConfigs = (webSkel.company.documents);
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    openTab(_target) {
        let selectedTab = document.getElementById("selected-tab");
        this.tab = _target.firstElementChild.nextElementSibling.firstElementChild.innerText;
        if(selectedTab !== _target) {
            switch(selectedTab.firstElementChild.nextElementSibling.firstElementChild.innerText) {
                case "Announces":
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
            }

            switch(this.tab) {
                case "Announces":
                    this.pageContent = `<announces-page data-presenter="announces-page"></announces-page>`;
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
            }
            this.invalidate();
        }
    }

    beforeRender() {

    }
}