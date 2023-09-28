import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";
import { brainstormingPage, Chapter, DocumentModel } from "../../../imports.js";

export class addChapterModal {
    constructor() {
        let url = window.location.hash;
        this.docId =  url.split('/')[1];
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }
        this._document = webSkel.space.getDocument(this.docId);
        this._document.observeChange(this._document.getNotificationId(), this.updateState);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addChapter(_target) {
        let formData = await extractFormInformation(_target);
        if(formData.isValid) {
            // let updateDocument = webSkel.space.getDocument(this.docId);
            closeModal(_target);
            let chapterObj={
                title: formData.data.name,
                id: this._document.chapters.length + 1,
                paragraphs: [{id: 1, text: "Edit here your first paragraph."}]
            }
            let newChapter = new Chapter(chapterObj);
            this._document.chapters.push(newChapter);
            await documentFactory.storeDocument(currentSpaceId, this._document);
            this._document.notifyObservers(this._document.getNotificationId());
        }
    }
}