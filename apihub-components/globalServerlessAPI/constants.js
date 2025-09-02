module.exports = {
    LANDING_PRESENTER :`
export class LandingPresenter {
    constructor(element, invalidate)
    {
        this.element = element;
        this.invalidate = invalidate;
        let urlParts = window.location.hash.split("/");
        this.currentPage = urlParts[2];
        this.invalidate();
    }
    beforeRender(){
    }
    afterRender(){
        if(!this.currentPage){
            this.element.innerHTML = "<div>Your code here</div>";
        }
    }
    async navigateInternal(targetElement, pageName){
         const pageUrl = assistOS.space.id + "/" + $$appName + "/" + pageName;
         await assistOS.UI.changeToDynamicPage($$landingPageName, pageUrl);
    }
}`,
    LANDING_HTML : `<$$currentPage data-presenter="$$currentPage"></$$currentPage>`,
    APP_FOLDERS : {
        WEB_COMPONENTS: "web-components",
        BACKEND_PLUGINS: "backend-plugins",
        DOCUMENT_PLUGINS: "document-plugins",
        THEMES: "themes",
        CHAT_SCRIPTS: "chat-scripts"
    }
}
