export class myWebPage {
    constructor(element, invalidate) {
        this.element = element;
        webSkel.currentUser.space.observeChange(webSkel.currentUser.space.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.myWebPageContainer = "";
        this.pageOptions = "";
        let selectedPageHtml = "";
        debugger
        if (webSkel.currentUser.space.pages.length > 0) {
            webSkel.currentUser.space.pages.forEach((page) => {
                this.myWebPageContainer += `<page-unit data-title="${page.title}"
        data-content="${page.text}" data-date="${page.date}"
        data-id="${page.id}" data-local-action="editAction"></page-unit>`;
                this.pageOptions += `<option value="${page.id}">${page.title}</option>`;
            });
        } else {
            this.myWebPageContainer = `<div class="no-data-loaded">No pages for now</div>`;
        }
    }

    afterRender() {
        this.element.querySelector("#pages").addEventListener("change", (event) => {
            debugger;
            this.selectedPageId = event.target.value;
            this.textAreaValue = webSkel.currentUser.space.pages.find((page) => {
                return page.id === this.selectedPageId;
            }).html;
            this.textArea = this.element.querySelector("#pageCode");
            this.textArea.value = this.textAreaValue;
        });
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await webSkel.UtilsService.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    getPageId(_target) {
        return webSkel.UtilsService.reverseQuerySelector(_target, "page-unit").getAttribute("data-id");
    }

    async showAddPageModal() {
        await webSkel.UtilsService.showModal(document.querySelector("body"), "add-page-modal", {presenter: "add-page-modal"});
    }

    async deleteAction(_target) {
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeletePage");
        await webSkel.getService("LlmsService").callFlow(flowId, this.getPageId(_target));
        this.invalidate();
    }

    async editAction(_target) {
        await webSkel.UtilsService.showModal(document.querySelector("body"), "edit-my-web-page-modal", {
            presenter: "edit-my-web-page-modal",
            id: this.getPageId(_target)
        });
    }
}