export class ChangeApplication {
    static id = "2vA3ZipyUcZC";
    static description = "Changes the current application";
    static dependencies = ["changeSelectedPageFromSidebar"]
    constructor(changeSelectedPageFromSidebar) {
        this.changeSelectedPageFromSidebar = changeSelectedPageFromSidebar;
    }
    async start(pageId, refreshFlag) {
        try {
            if (refreshFlag === '0') {
                if (pageId === window.location.hash.slice(1)) {
                    return;
                }
            }

            this.changeSelectedPageFromSidebar(pageId);

            if (pageId.startsWith("space")) {
                let page = pageId.split("/")[1];
                await webSkel.changeToDynamicPage(page, pageId);
            } else {
                await webSkel.changeToDynamicPage(pageId, pageId);
            }

            this.return(pageId);
        } catch (e) {
            this.fail(e);
        }
    }
}