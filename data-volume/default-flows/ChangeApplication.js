class ChangeApplication {
    static description = "Changes the current application";
    async start(context) {
        try {
            if (context.refreshFlag === '0') {
                if (context.pageId === window.location.hash.slice(1)) {
                    return;
                }
            }

            assistOS.changeSelectedPageFromSidebar(context.pageId);

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
module.exports = ChangeApplication;