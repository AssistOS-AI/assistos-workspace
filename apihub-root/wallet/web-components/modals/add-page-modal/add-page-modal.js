import {
    closeModal,
    extractFormInformation
} from "../../../imports.js";

export class addPageModal {
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.documentOptions = "";
        const select = document.querySelector('select');
        webSkel.currentUser.space.documents.forEach((document) => {
            this.documentOptions += `<option value="${document.id}">${document.title}</option>`;
        });
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addPageSubmitForm(_target) {
        let formInfo = await extractFormInformation(_target);
        if (formInfo.isValid) {
            const selectedDocumentId = formInfo.data.document;
            const selectedDocument = webSkel.currentUser.space.documents.find((document) => {
                return document.id === selectedDocumentId;
            });


            let pageData = {
                title: formInfo.data.title,
                date: new Date().toISOString().split('T')[0],
            };

            pageData.html = `
            <div class="page-data">
                <h1>${selectedDocument.title}</h1>
                <p>${selectedDocument.abstract}</p>
                ${selectedDocument.chapters.map(chapter => `
                    <div class="chapter">
                        <h2>${chapter.title}</h2>
                        ${chapter.paragraphs.map(paragraph => `
                            <p>${paragraph.text}</p>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;

            let flowId = webSkel.currentUser.space.getFlowIdByName("AddPage");
            await webSkel.getService("LlmsService").callFlow(flowId, pageData);
            webSkel.currentUser.space.notifyObservers(webSkel.currentUser.space.getNotificationId());
            closeModal(_target);
        }
    }
}