export class MyWebPage {
    constructor(element, invalidate) {
        this.element = element;
        assistOS.space.observeChange(assistOS.space.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.myWebPageContainer = "";
        this.pageOptions = "";
        let selectedPageHtml = "";
        if (assistOS.space.pages.length > 0) {
            assistOS.space.pages.forEach((page) => {
                this.myWebPageContainer += `<page-item data-title="${page.title}"
        data-content="${page.text}" data-date="${page.date}"
        data-id="${page.id}" data-local-action="editAction"></page-item>`;
                this.pageOptions += `<option value="${page.id}">${page.title}</option>`;
            });
        } else {
            this.myWebPageContainer = `<div class="no-data-loaded">No pages for now</div>`;
        }
    }

    afterRender() {
        this.element.querySelector("#pages").addEventListener("change", (event) => {
            this.selectedPageId = event.target.value;
            this.textAreaValue = assistOS.space.pages.find((page) => {
                return page.id === this.selectedPageId;
            }).html;
            this.textArea = this.element.querySelector("#pageCode");
            this.textArea.value = this.textAreaValue;
        });
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await assistOS.UI.UtilsService.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    getPageId(_target) {
        return assistOS.UI.reverseQuerySelector(_target, "page-item").getAttribute("data-id");
    }

    async showAddPageModal() {
        await assistOS.UI.showModal( "add-page-modal");
    }

    async deleteAction(_target) {
        await assistOS.callFlow("DeletePage", this.getPageId(_target));
        this.invalidate();
    }

    async editAction(_target) {
        await assistOS.UI.showModal( "edit-my-web-page-modal", {
            presenter: "edit-my-web-page-modal",
            id: this.getPageId(_target)
        });
    }
}