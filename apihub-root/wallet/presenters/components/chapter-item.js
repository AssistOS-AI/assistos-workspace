import { Company } from "../../core/company.js";
import { Registry } from "../../core/services/registry.js";
import { Document } from "../../core/models/document.js";
import { getClosestParentElement } from "../../../WebSkel/utils/dom-utils.js";

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
            this._documentConfigs = companyState.documents;
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
            this.chapterContent += `<paragraph-item data-paragraph-content="${paragraph.text}"></paragraph-item>`;
        });
    }

    showOrHideChapter(_target, chapterId) {
        //TO DO: use getClosestParentElement in order to get the chapter id
        _target.parentNode.nextElementSibling.firstElementChild.nextElementSibling.classList.toggle('hidden');
        _target.parentNode.nextElementSibling.firstElementChild.classList.toggle('hidden');
        _target.classList.toggle('rotate');
    }

    moveUp(_target) {
        //TO DO: use getClosestParentElement in order to get the chapters and swap them
        console.log(getClosestParentElement(_target, ".chapter-item"));
        let currentChapterId = getClosestParentElement(_target, ".chapter-item").getAttribute('data-id');
        /*
        * getCurrentDoc
        * getChapters
        * swap current chapter with the one above
        * */
    }

    moveDown(_target) {
        //TO DO: use getClosestParentElement in order to get the chapters and swap them
        let currentChapterId = _target.parentNode.parentNode.parentNode.parentNode.getAttribute('data-id');
        /*
        * getCurrentDoc
        * getChapters
        * swap current chapter with the one below
        * */
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}