export class DisplayPreferences {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.activeTab = "style";
        this.invalidate();
    }

    async beforeRender() {
        if (this.activeTab === "style") {
            this.tabContent = `<style-subpage data-presenter="style-page"></style-subpage>`;
        } else if (this.activeTab === "export") {
            this.tabContent = `<export-subpage data-presenter="export-subpage"></export-subpage>`;
        } else if (this.activeTab === "print") {
            this.tabContent = `<print-subpage data-presenter="print-subpage"></print-subpage>`;
        }
    }

    afterRender() {
        let activeTab = this.element.querySelector(`#${this.activeTab}`);
        activeTab.classList.add("active");
    }
    changeHeader(eventTarget, tabName) {
        this.activeTab = tabName;
        const tabs = this.element.querySelectorAll(".header-header");
        tabs.forEach((tab) => {
            tab.classList.remove("active");
        });
        this.invalidate();
    }
}