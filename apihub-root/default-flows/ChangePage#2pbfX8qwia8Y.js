export class ChangePage{
    static id = "2pbfX8qwia8Y";
    static description = "Redirects you to a page";
    constructor() {

    }

    async start (pageHtmlTagName, url, dataPresenterParams, skipHistoryState) {
        try {
            await webSkel.changeToDynamicPage(pageHtmlTagName, url, dataPresenterParams, skipHistoryState);
            this.return(pageHtmlTagName);
        } catch (e) {
            this.fail(e);
        }
    }
}