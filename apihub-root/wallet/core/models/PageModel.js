export class PageModel {
    constructor(webPageData) {
        this.title = webPageData.title;
        this.id = webPageData.id || assistOS.services.generateId();
        this.date = webPageData.date;
        this.html = webPageData.html;
    }
}