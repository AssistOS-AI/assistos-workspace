import { closeModal, showActionBox, showModal } from "../../../imports.js";

export class brainstormingPage {
    constructor(element) {
        this.element = element;
        let url = window.location.hash;
        this.id = parseInt(url.split('/')[1]);
        this.docTitle = "Titlu document";
        this.tab = "Chapters";
        this.id1 = "selected-tab";
        this.id2 = "";
        this.idModal1 = "selected-modal";
        this.idModal2 = "";
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

        this.documentService = webSkel.getService('documentService');
        this._document = this.documentService.getDocument(this.id);
        if(this._document) {
            this.docTitle = this._document.title;
            if(this._document.abstract) {
                this.abstractText = this._document.abstract;
            }
        }
    }

    beforeRender() {
        if(!this._document.mainIdeas || this._document.mainIdeas.length === 0) {
            this.generateMainIdeasButtonName = "Summarize";
        } else {
            this.generateMainIdeasButtonName = "Regenerate";
        }
        this.pageRender(this.tab);
    }

    openEditTitlePage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-title`);
    }

    openEditAbstractPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-abstract`);
    }

    openDocumentSettingsPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/settings`);
    }

    openBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/brainstorming`);
    }

    openViewPage() {
        webSkel.changeToStaticPage(`documents/${this.id}`);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async showAddChapterModal() {
        await showModal(document.querySelector("body"), "add-chapter-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    openTab(_target) {
        let selectedTab = document.getElementById("selected-tab");
        this.tab = _target.firstElementChild.nextElementSibling.firstElementChild.innerText;
        console.log(this.tab);
        this.chaptersDiv = "";
        if(selectedTab !== _target) {
            this.pageRender(this.tab);
            this.invalidate();
        }
    }

    pageRender(tab) {
        switch(tab) {
            case "Chapters":
                this.id1 = "selected-tab";
                this.idModal1 = "selected-modal";
                this.id2 = "";
                this.idModal2 = "";
                this.chaptersDiv = "";
                if(this._document) {
                    let number = 0;
                    this._document.chapters.forEach((item) => {
                        number++;
                        this.chaptersDiv += `<brainstorming-chapter-unit nr="${number}" title="${item.title}"></brainstorming-chapter-unit>`;
                    });
                }
                break;
            case "Possible Ideas":
                this.id1 = "";
                this.idModal1 = "";
                this.id2 = "selected-tab";
                this.idModal2 = "selected-modal";
                this.chaptersDiv = "";
                for(let number = 1; number < 4; number++) {
                    this.chaptersDiv += `<brainstorming-document-idea nr="${number}" title="Idea ${number}"></brainstorming-document-idea>`;
                }
                break;
        }
    }
}