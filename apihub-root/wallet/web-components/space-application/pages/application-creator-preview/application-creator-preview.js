const spaceModule = require('assistos').loadModule('space', {});

const getChatIframe = (spaceId, personalityId) => {
    return `<iframe
        id="chatFrame"
        src="http://localhost:8080/iframes/chat?spaceId=${spaceId}&personalityId=${personalityId}"
        allowfullscreen
        style="width: 100%; height: 100%; border: none;"
        loading="lazy">
    </iframe>`
}

const getConfiguration = async function (spaceId) {
    const configuration = await spaceModule.getWebAssistantConfiguration(spaceId)
    return configuration;
}

export class ApplicationCreatorPreview {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.pageName = "Preview"
        this.spaceId = assistOS.space.id;
        this.invalidate();

    }
    async beforeRender() {
        this.configuration = await getConfiguration(this.spaceId);
        this.content = getChatIframe(this.spaceId, this.configuration.settings.personality);
    }

    async afterRender() {

    }

}
