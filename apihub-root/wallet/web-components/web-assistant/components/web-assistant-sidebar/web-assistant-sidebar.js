const getChatIframeURL = (spaceId) => {
    return `http://localhost:8080/chat-iframe?space=${spaceId}`
}

export class WebAssistantSidebar {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.applicationPagesRoot = document.querySelector('#web-assistant-page-container');
        this.invalidate();
    }

    async beforeRender() {
    }
    launchIframe(){
        window.open(getChatIframeURL(assistOS.space.id), '_blank')
    }
    openPage(button, pageName){
        this.applicationPagesRoot.innerHTML = `<${pageName} data-presenter="${pageName}"></${pageName}>`;
    }

    async afterRender() {

    }
}