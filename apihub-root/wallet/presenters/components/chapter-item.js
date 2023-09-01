import { Company } from "../../core/company.js";
import { Registry } from "../../core/services/registry.js";
import { Document } from "../../core/models/document.js";

export class chapterItem {
    constructor() {
        this.chapterContent = "";
        let currentCompany = Company.getInstance();
        this.chapterContent = "chapter's content";
        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = (companyState)=> {
            // this._documentConfigs = companyState.documents;
            this.invalidate();
        }
        currentCompany.onChange(this.updateState);
    }

    beforeRender() {
        this.chapterContent = "";
        this.docId = webSkel.registry.currentDocumentId;
        this._document = webSkel.registry.getDocument(this.docId);
        this.chapter = this._document.getCurrentChapter();
        this.chapter.paragraphs.forEach((paragraph) => {
            // this.chapterContent += `<paragraph-item data-paragraph-id="${paragraph.id}" data-paragraph-content="${paragraph.text}" data-presenter="paragraph-item"></paragraph-item>`;
            this.chapterContent += `<p>${paragraph.text}</p>`;
        });
    }

    showOrHideChapter(_target, chapterId) {
        let target = document.querySelector(`[data-id="${chapterId}"]`);
        target.firstElementChild.nextElementSibling.classList.toggle('hidden');
        target.firstElementChild.firstElementChild.classList.toggle('rotate');
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}