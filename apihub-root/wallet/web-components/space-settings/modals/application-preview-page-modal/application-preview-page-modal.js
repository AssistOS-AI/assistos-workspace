const getChatIframe = (spaceId, webAssistantId, pageID) => {
    return `<iframe
        id="chatFrame"
        src="http://localhost:8080/iframes/chat?space=${spaceId}&webAssistant=${webAssistantId}&page=${pageID}"
        allowfullscreen
        style="width: 100%; height: 100%; border: none;"
        loading="lazy">
    </iframe>`
}

const WebAssistant = assistOS.loadModule("webassistant");

export class ApplicationPreviewPageModal {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.modalName = "Preview"
        this.spaceId = assistOS.space.id;
        this.assistantId = assistOS.space.webAssistant;
        this.pageId = this.element.getAttribute('data-id');
        this.invalidate();
    }

    async beforeRender() {
        this.configuration = await WebAssistant.getWebAssistant( this.spaceId , this.assistantId)
        this.iframe = getChatIframe(this.spaceId,this.assistantId,this.pageId);
    }

    async afterRender() {

    }

    async closeModal() {
        await assistOS.UI.closeModal(this.element);
    }

}