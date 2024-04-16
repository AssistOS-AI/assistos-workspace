export class ChangePage{
    static id = "2pbfX8qwia8Y";
    static description = "Redirects you to a page";
    async start (context){
        try {
            await assistOS.UI.changeToDynamicPage(context.pageHtmlTagName, context.url, context.dataPresenterParams, context.skipHistoryState);
            this.return(context.pageHtmlTagName);
        } catch (e) {
            this.fail(e);
        }
    }
}