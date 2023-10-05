import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";
import {Chapter, Paragraph} from "../../../imports.js";

export class addChapterModal {
    constructor(element, invalidate) {
        let url = window.location.hash;
        this.docId =  url.split('/')[1];
        this._document = webSkel.space.getDocument(this.docId);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.invalidate();


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
                id: webSkel.getService("UtilsService").generateId(),
                paragraphs: [new Paragraph({id: webSkel.getService("UtilsService").generateId(), text: "Edit here your first paragraph."})]
            }
            let newChapter = new Chapter(chapterObj);
            this._document.chapters.push(newChapter);
            await documentFactory.updateDocument(currentSpaceId, this._document);
            this._document.notifyObservers(this._document.getNotificationId());
        }
    }
}