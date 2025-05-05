export class DocumentVariableDetails {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentId = this.element.getAttribute("data-document-id");
        let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this.document = documentPresenter._document;
        this.element.classList.add("maintain-focus");
        this.varName = this.element.getAttribute("data-name");
        this.varCommand = this.element.getAttribute("data-command");
        this.encodedExpression = this.element.getAttribute("data-expression");
        this.activeTab = "valuesTab";
        this.invalidate();
    }

    async beforeRender() {
        if (this.activeTab === "valuesTab") {
            this.tabContent = `<variable-values-tab data-name="${this.varName}" data-presenter="variable-values-tab"></variable-values-tab>`;
        } else if (this.activeTab === "editTab") {
            this.tabContent = `<edit-variable-tab data-name="${this.varName}" data-expression="${this.encodedExpression}" data-command="${this.varCommand}" data-presenter="edit-variable-tab"></edit-variable-tab>`;
        }
    }

    afterRender() {
        let activeTab = this.element.querySelector(`.${this.activeTab}`);
        activeTab.classList.add("active");
        let icon = activeTab.querySelector(".tab-icon");
        icon.style.setProperty('--icon-color', 'var(--blue-button)');
    }

    changeTab(_eventTarget, tabName) {
        this.activeTab = tabName;
        this.invalidate();
    }
    closeModal(){
         assistOS.UI.closeModal(this.element)
    }
}
