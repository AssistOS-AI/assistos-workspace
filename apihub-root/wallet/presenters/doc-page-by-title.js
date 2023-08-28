import { Company } from "../core/company.js";

export class docPageByTitle {
    constructor() {
        this.title = "Documents";
        this.name = "Name";
        this.abstractText = "Abstract text";
        this.button = "Add new document";
        let currentCompany = Company.getInstance();

        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            console.log(this._documentConfigs.length);
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = (companyState)=> {
            console.log("Update State");
            this._documentConfigs = companyState.documents;
            this.invalidate();
        }
        currentCompany.onChange(this.updateState);
    }

    beforeRender() {
        let documentContent = document.querySelector("doc-page-by-title");
        this.id = documentContent.getAttribute("data-document-id");
        this.chapters="";
        if(this._documentConfigs) {
            this._doc = this._documentConfigs.find(document => document.id === this.id);
            try {
                this.title=this._doc.name;
                this.abstractText = this._doc.abstract;
                this._doc.chapters.forEach((item) => {
                    this.chapters += `<new-chapter data-chapter-title="${item.name}" data-chapter-content="${item.content}"></new-chapter>`;
                });
            } catch(e) {}
        } else {
            this.chapters=`<div> No Data Currently </div>`;
        }
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {
        const editTitleButton = document.querySelector('#edit-title');
        editTitleButton.addEventListener('click', () => {
            webSkel.changeToStaticPage(`documents/${this.id}/edit-title`);
        });

        const editAbstractButton = document.querySelector('#edit-abstract');
        editAbstractButton.addEventListener('click', () => {
            webSkel.changeToStaticPage(`documents/${this.id}/edit-abstract`);
        });

        const settingsButton = document.querySelector('#settings');
        settingsButton.addEventListener('click', () => {
            webSkel.changeToStaticPage(`documents/${this.id}/settings`);
        });

        const brainstormingButton = document.querySelector('#brainstorming');
        brainstormingButton.addEventListener('click', () => {
            webSkel.changeToStaticPage(`documents/${this.id
            }/brainstorming`);
        });

        const chapters = document.querySelectorAll('.new-chapter');
        chapters.forEach(chapter => {
            const title = chapter.querySelector('.chapter-title');
            const arrow = title.querySelector('.arrow');
            const content = chapter.querySelector('.chapter-content');

            arrow.addEventListener('click', () => {
                content.classList.toggle('hidden');
                arrow.classList.toggle('rotate');
            });
        });
    }
}