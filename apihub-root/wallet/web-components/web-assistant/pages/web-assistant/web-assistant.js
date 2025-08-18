const getChatIframeURL = (spaceId) => {
    return `http://localhost:8080/chat-iframe?space=${spaceId}`
}
export class WebAssistant {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    pages = {
        "themes": "themes-page",
        "settings":"web-assistant-settings",
        "scripts":"chat-scripts-page"
    };
    async beforeRender(){
        let URLParts = window.location.hash.slice(1).split('/');
        let currentPage = URLParts[URLParts.length - 1];
        if(!Object.keys(this.pages).includes(currentPage)){
            currentPage = "settings";
            //window.location.hash = `${assistOS.space.id}/Space/web-assistant/settings`;
        }
        let webComponent = this.pages[currentPage];
        this.currentPage = `<${webComponent} data-presenter="${webComponent}"><${webComponent}/>`;

    }
    launchIframe(){
        window.open(getChatIframeURL(assistOS.space.id), '_blank')
    }
    async openPage(button, pageName){
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/web-assistant/${pageName}`);
    }
    async afterRender(){
    }

}