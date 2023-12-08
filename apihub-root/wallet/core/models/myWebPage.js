export class MyWebPage {
    constructor(webPageData) {
        debugger
        this.title = webPageData.title;
        this.id = webPageData.id || webSkel.getService("UtilsService").generateId();
        this.date = webPageData.date;
        this.text = webPageData.text;
    }
}