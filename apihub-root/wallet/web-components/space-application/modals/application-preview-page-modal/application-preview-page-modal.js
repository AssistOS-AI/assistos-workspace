const getChatIframe = (spaceId, personalityId, pageID) => {
    return `<iframe
        id="chatFrame"
        src="http://localhost:8080/iframes/chat?spaceId=${spaceId}&personalityId=${personalityId}&pageId=${pageID}"
        allowfullscreen
        style="width: 100%; height: 100%; border: none;"
        loading="lazy">
    </iframe>`
}

const spaceModule = require('assistos').loadModule('space', {});

const getConfiguration = async function (spaceId) {
    const configuration = await spaceModule.getWebAssistantConfiguration(spaceId)
    return configuration;
}

export class ApplicationPreviewPageModal {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.modalName = "Preview"
        this.spaceId = assistOS.space.id;
        this.pageId = this.element.getAttribute('data-id');
        this.invalidate();
    }

    async beforeRender() {
        this.configuration = await getConfiguration(this.spaceId);
        this.iframe = getChatIframe(this.spaceId,this.configuration.settings.personality, this.pageId);
    }

    async afterRender() {

    }

    async closeModal() {
        await assistOS.UI.closeModal(this.element);
    }

}