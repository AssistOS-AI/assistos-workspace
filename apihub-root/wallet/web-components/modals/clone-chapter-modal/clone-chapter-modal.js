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
        let personalityId = formData.data.chapterPersonality;
        let chapterTitle = formData.data.chapterTitle;

        let proofread = formData.data.proofread === "on";
        let personalityDescription="copy";
        if(personalityId!=="copy"){
            personalityDescription=webSkel.currentUser.space.personalities.find(personality=>personality.id===personalityId).description;
        }
        let simplifiedChapterJson= JSON.stringify(webSkel.currentUser.space.getDocument(this.documentId).getChapter(this.chapterId).simplifyChapter());
        let flowId = webSkel.currentUser.space.getFlowIdByName("clone chapter");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, simplifiedChapterJson,personalityDescription, proofread);
        let chapterData = result.responseJson;
        chapterData.title = chapterTitle;

        webSkel.currentUser.space.getDocument(this.documentId).getChapter(this.chapterId).addAlternativeChapter(chapterData);
        await documentFactory.updateDocument(webSkel.currentUser.space.id, webSkel.currentUser.space.getDocument(this.documentId));
        webSkel.currentUser.space.getDocument(this.documentId).notifyObservers("doc:chapter-brainstorming-page");
        closeModal(_target);
    }
}
