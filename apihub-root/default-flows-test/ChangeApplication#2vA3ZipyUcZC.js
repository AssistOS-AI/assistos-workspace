import {changeSelectedPageFromSidebar} from "../../../../../wallet/main.js";

export class ChangeApplication {
    static id = "2vA3ZipyUcZC";
    constructor() {
        this.name = "ChangeApplication";
        this.description = "Changes the current application";
    }
    async start(pageId, refreshFlag) {
        try {
            if (refreshFlag === '0') {
                if (pageId === window.location.hash.slice(1)) {
                    return;
                }
            }

            changeSelectedPageFromSidebar(pageId);

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