module.exports = {
    PRESENTER_TEMPLATE :`
export class TemplatePresenter {
    constructor(element, invalidate)
    {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){
    }
    afterRender(){
    }
}`,
    HTML_TEMPLATE : `<div>Your app code here</div>`,
    APP_FOLDERS : {
        WEB_COMPONENTS: "web-components",
        BACKEND_PLUGINS: "backend-plugins",
        DOCUMENT_PLUGINS: "document-plugins",
        THEMES: "themes"
    }
}
