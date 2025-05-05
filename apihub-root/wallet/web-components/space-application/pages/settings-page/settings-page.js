
export class SettingsPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.activeTab = "collaboratorsTab";
        this.invalidate();
    }

    async beforeRender() {
        if (this.activeTab === "keysTab") {
            this.tabContent = `<keys-tab data-presenter="keys-tab"></keys-tab>`;
        } else if (this.activeTab === "collaboratorsTab") {
            this.tabContent = `<collaborators-tab data-presenter="collaborators-tab"></collaborators-tab>`;
        } else if (this.activeTab === "settingsTab") {
            this.tabContent = `<display-preferences data-presenter="display-preferences"></display-preferences>`;
        } else if (this.activeTab === "webAssistant") {
            this.tabContent = `
            <application-creator-landing data-presenter="application-creator-landing"></application-creator-landing>
            `
        } else if (this.activeTab === "advancedSettings") {
            this.tabContent = "<advanced-settings data-presenter='advanced-settings'></advanced-settings>";
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
}
