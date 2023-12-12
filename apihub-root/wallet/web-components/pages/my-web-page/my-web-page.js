import {
    showActionBox,
    showModal,
    reverseQuerySelector
} from "../../../imports.js";

export class myWebPage {
    constructor(element, invalidate) {
        webSkel.currentUser.space.observeChange(webSkel.currentUser.space.getNotificationId(),invalidate);
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.myWebPageContainer = "";
        if (webSkel.currentUser.space.pages.length > 0) {
            webSkel.currentUser.space.pages.forEach((page) => {
                this.myWebPageContainer += `<page-unit data-title="${page.title}"
                data-content="${page.text}" data-date="${page.date}"
                data-id="${page.id}" data-local-action="editAction"></page-unit>`;
            });
        } else {
            this.myWebPageContainer = `<div class="no-data-loaded">No announcements for now</div>`;
        }
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    getAnnouncementId(_target) {
        return reverseQuerySelector(_target, "page-unit").getAttribute("data-id");
    }

    async showMyWebPageModal() {
        await showModal(document.querySelector("body"), "my-web-page-modal", {presenter: "my-web-page-modal"});
    }

    async deleteAction(_target) {
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeletePage");
        await webSkel.getService("LlmsService").callFlow(flowId, this.getAnnouncementId(_target));
        this.invalidate();
    }

    async editAction(_target) {
        await showModal(document.querySelector("body"), "edit-my-web-page-modal", {
            presenter: "edit-my-web-page-modal",
            id: this.getAnnouncementId(_target)
        });
    }
}