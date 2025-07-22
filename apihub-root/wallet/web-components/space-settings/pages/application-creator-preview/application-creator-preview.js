const WebAssistant = assistOS.loadModule("webassistant",{});


const getChatIframe = (spaceId, webAssistantId) => {
    return `<iframe
        id="chatFrame"
        src="http://localhost:8080/iframes/chat?space=${spaceId}&webAssistant=${webAssistantId}"
        allowfullscreen
        style="width: 100%; height: 100%; border: none;"
        loading="lazy">
    </iframe>`
}

export class ApplicationCreatorPreview {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.pageName = "Launch"
        this.spaceId = assistOS.space.id;
        this.invalidate();
    }
    async beforeRender() {
        this.configuration = await WebAssistant.getWebAssistant(this.spaceId,assistOS.space.webAssistant);
        this.content = getChatIframe(this.spaceId, this.configuration.id);
    }

    async afterRender() {

    }

}
