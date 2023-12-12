export class PageModel {
    constructor(webPageData) {
        this.title = webPageData.title;
        this.id = webPageData.id || webSkel.getService("UtilsService").generateId();
        this.date = webPageData.date;
        this.html = webPageData.html;
    }
}