import {
    extractFormInformation,
    closeModal, parseURL,
} from "../../../imports.js";

export class cloneChapterModal {
    constructor(element, invalidate) {
        [this.documentId,this.chapterId]=parseURL();
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        let stringHTML = `<option value="copy" selected>Copy</option>`;
        for (let personality of webSkel.currentUser.space.personalities) {
            stringHTML += `<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
        this.currentChapterTitle = `[Clone] ${webSkel.currentUser.space.getDocument(this.documentId).getChapter(this.chapterId).title}`;
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async cloneChapter(_target) {
        let formData = await extractFormInformation(_target);
        let proofread = formData.data.proofread === "on";
        let flowId = webSkel.currentUser.space.getFlowIdByName("CloneChapter");
        await webSkel.getService("LlmsService").callFlow(flowId, this.documentId, this.chapterId, formData.data.chapterPersonality, formData.data.chapterTitle, proofread);
        webSkel.currentUser.space.getDocument(this.documentId).notifyObservers("doc:chapter-brainstorming-page");
        closeModal(_target);
    }
}
