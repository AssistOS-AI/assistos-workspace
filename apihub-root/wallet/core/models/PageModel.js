export class PageModel {
    constructor(webPageData) {
        this.title = webPageData.title;
        this.id = webPageData.id;
        this.date = webPageData.date;
        this.html = webPageData.html;
    }
}