import { Company } from "../core/company.js";

export class docPageByTitle {
    constructor() {
        this.title = "Documents";
        this.name = "Name";
        this.abstractText = "Abstract text";
        this.button = "Add new document";
        let currentCompany= Company.getInstance();
        setTimeout(async ()=> {
            this._documentConfigs = await currentCompany.companyState.documents;
            this.invalidate();
        },0);
        currentCompany.onChange(async (companyState) => {
            this._documentConfigs = await companyState.documents;
            this.invalidate();
        });
    }

    beforeRender() {
        let documentContent = document.querySelector("doc-page-by-title");
        this.primaryKey = documentContent.getAttribute("data-document-id");
        this.chapters="";
        if(this._documentConfigs) {
            this._doc = this._documentConfigs.find(document => document.primaryKey === this.primaryKey);
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
            webSkel.changeToStaticPage(`documents/${this.primaryKey}/edit-title`);
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