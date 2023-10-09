import {DocumentModel, extractFormInformation} from "../../../imports.js";

export class documentSettingsPage {
    constructor(element, invalidate) {
        this.element = element;
        let url = window.location.hash;
        this.id = url.split('/')[1];
        this._document = webSkel.space.getDocument(this.id);
        this.pluralToSingular = { personalities: "personality", llms: "llm"};
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        // caz 1 no script
        // caz 2 there is a selected script already
        // caz 3 no selected script
        const renderSettings = (component, selectedItem, itemName) => {
            let htmlString = "";
            if(component.length === 0) {
                htmlString += `<option selected disabled value="" hidden>No ${itemName} in space</option>`;
                return htmlString;
            }
            if(this._document.settings[itemName]) {
                htmlString+=`<option selected data-id="${this._document.settings[itemName].id}" value="${this._document.settings[itemName].id}"> ${this._document.settings[itemName].name}</option>`;
            } else {
                htmlString+=`<option selected disabled value="" hidden>No ${itemName} selected</option>`;
            }
            for(let item of component) {
                if(!selectedItem || selectedItem.name !== item.name) {
                    htmlString += `<option data-id="${item.id}" value="${item.id}">${item.name}</option>`;
                }
            }
            return htmlString;
        }
        for (const [key, value] of Object.entries(webSkel.space.settings)) {
            this[key] = renderSettings(value, this._document.settings[this.pluralToSingular[key]], this.pluralToSingular[key]);
        }

        this.documentTitleScriptId = renderSettings(webSkel.space.scripts, this._document.settings["documentTitleScriptId"], "documentTitleScriptId");

    }

    async saveSettings(_target) {
        const updateOption = (optionKey, optionId) => {
            if(optionKey === "personalities"){
                let option = webSkel.space.settings[optionKey].find(option => option.id === optionId);
                if(option) {
                    if(this._document.settings[this.pluralToSingular[optionKey]] !== option) {
                        this._document.settings[this.pluralToSingular[optionKey]] = option;
                    }
                    return true;
                }
                return false;
            } else {
                this._document.settings[optionKey] = optionId;
                return true;
            }
        }
        let formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            for (const [key, value] of Object.entries(formInfo.data)) {
                if(!updateOption(key, value)) {
                    await showApplicationError(`Error updating option`, `Option ${key} index not found`, `Option ${key}: value ${value}`);
                }
            }
            await documentFactory.updateDocument(currentSpaceId, this._document);
        }
        else {
            await showApplicationError(`Error at submitting form`, `Form invalid`, `Form with target: ${_target}`);
        }
    }

    async openEditTitlePage() {
        await webSkel.changeToDynamicPage("edit-title-page", `documents/${this.id}/edit-title-page`);
    }

    async openEditAbstractPage() {
        await webSkel.changeToDynamicPage("edit-abstract-page", `documents/${this.id}/edit-abstract-page`);
    }

    async openDocumentSettingsPage() {
        await webSkel.changeToDynamicPage("document-settings-page", `documents/${this.id}/document-settings-page`);
    }

    async openManageChaptersPage() {
        await webSkel.changeToDynamicPage("manage-chapters-page", `documents/${this.id}/manage-chapters-page`);
    }

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this.id}/document-view-page`);
    }
}