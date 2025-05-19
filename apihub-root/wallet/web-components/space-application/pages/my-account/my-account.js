export class MyAccount {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.activeTab = "data"
        this.props = props;
        this.invalidate();
    }

    async beforeRender() {
        if (this.activeTab === "data") {
            this.tabContent = `<my-account-data data-presenter="my-account-data"></my-account-data>`;
        } else {
            this.tabContent = `<my-account-logins data-presenter="my-account-logins"></my-account-logins>`;
        }
    }

    async afterRender() {
        let activeTab = this.element.querySelector(`#${this.activeTab}`);
        activeTab.classList.add("active");
    }

    changeHeader(eventTarget, tabName) {
        this.activeTab = tabName;
        this.invalidate();
    }
}