export class PageModel {
    constructor(webPageData) {
        this.title = webPageData.title;
        this.id = webPageData.id || system.services.generateId();
        this.date = webPageData.date;
        this.html = webPageData.html;
    }
}