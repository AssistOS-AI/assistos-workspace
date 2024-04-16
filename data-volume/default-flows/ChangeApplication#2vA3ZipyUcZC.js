export class ChangeApplication {
    static id = "2vA3ZipyUcZC";
    static description = "Changes the current application";
    static dependencies = ["changeSelectedPageFromSidebar"]
    constructor(changeSelectedPageFromSidebar) {
        this.changeSelectedPageFromSidebar = changeSelectedPageFromSidebar;
    }
    async start(context) {
        try {
            if (context.refreshFlag === '0') {
                if (context.pageId === window.location.hash.slice(1)) {
                    return;
                }
            }

            this.changeSelectedPageFromSidebar(context.pageId);

            if (context.pageId.startsWith("space")) {
                let page = context.pageId.split("/")[1];
                await assistOS.UI.changeToDynamicPage(page, context.pageId);
            } else {
                await assistOS.UI.changeToDynamicPage(context.pageId, context.pageId);
            }

            this.return(context.pageId);
        } catch (e) {
            this.fail(e);
        }
    }
}