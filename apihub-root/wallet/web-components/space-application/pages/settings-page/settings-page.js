
export class SettingsPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.activeTab = "myaccountTab";
        this.invalidate();
    }

    async beforeRender() {
        if(this.activeTab==="myaccountTab"){
            this.tabContent = `<my-account data-presenter="my-account"></my-account>`;
            this.subpageName= "My Account";
        }
        if (this.activeTab === "keysTab") {
            this.tabContent = `<keys-tab data-presenter="keys-tab"></keys-tab>`;
            this.subpageName= "Secrets";
        } else if (this.activeTab === "collaboratorsTab") {
            this.tabContent = `<collaborators-tab data-presenter="collaborators-tab"></collaborators-tab>`;
            this.subpageName= "Collaborators";
        } else if (this.activeTab === "settingsTab") {
            this.tabContent = `<display-preferences data-presenter="display-preferences"></display-preferences>`;
            this.subpageName= "Settings";
        } else if (this.activeTab === "webAssistant") {
            this.tabContent = `
            <application-creator-landing data-presenter="application-creator-landing"></application-creator-landing>
            `
            this.subpageName= "Web Assistant";
        } else if (this.activeTab === "advancedSettings") {
            this.tabContent = "<advanced-settings data-presenter='advanced-settings'></advanced-settings>";
            this.subpageName= "Advanced Settings";
        }
    }


    afterRender() {
        const userIsNotAdmin=false;
        if(userIsNotAdmin){
            this.element.querySelectorAll(".adminTab").forEach(node=>node.style.display = "none");
        }
        let activeTab = this.element.querySelector(`.${this.activeTab}`);
        activeTab.classList.add("active");

    }

    changeTab(_eventTarget, tabName) {
        this.activeTab = tabName;
        this.invalidate();
    }
}
