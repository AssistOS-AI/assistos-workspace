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
        webSkel.space.onChange(this.updateState);
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
            let chapterObj={
                title:formData.data.name,
                id:updateDocument.chapters.length + 1,
                paragraphs: [{id:1, text:"Edit here your first paragraph."}]
            }
            let newChapter = new Chapter(chapterObj);
            updateDocument.chapters.push(newChapter);
            await this.documentService.updateDocument(updateDocument, this.docId);
        }
    }
}