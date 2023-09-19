import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";
import { Chapter } from "../../../imports.js";

export class addChapterModal {
    constructor() {
        let url = window.location.hash;
        this.docId =  parseInt(url.split('/')[1]);
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }
        this.documentService = webSkel.getService('documentService');
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addChapter(_target) {
        let formData = await extractFormInformation(_target);
        if(formData.isValid) {
            let updateDocument = this.documentService.getDocument(this.docId);
            closeModal(_target);
            let newChapter = new Chapter(formData.data.name, updateDocument.chapters.length + 1, [{id: 1, text: "Edit here your first paragraph."}]);
            updateDocument.chapters.push(newChapter);
            await this.documentService.updateDocument(updateDocument, this.docId);
        }
    }
}