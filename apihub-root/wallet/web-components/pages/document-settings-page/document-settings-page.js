import {extractFormInformation} from "../../../imports.js";

export class documentSettingsPage {
    constructor(element, invalidate) {
        this.element = element;
        let url = window.location.hash;
        this.id = url.split('/')[1];
        this._document = webSkel.currentUser.space.getDocument(this.id);
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
            if(selectedItem) {
                htmlString+=`<option selected data-id="${selectedItem.id}" value="${selectedItem.id}"> ${selectedItem.name}</option>`;
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
        if(this._document.settings){
            for (const [key, value] of Object.entries(this._document.settings)) {
                this[key] = renderSettings(webSkel.currentUser.space.scripts, this._document.getSettingsComponent(key), key);
            }
        }
    }

    async saveSettings(_target) {
        let formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            for (const [key, value] of Object.entries(formInfo.data)) {
                this._document.settings[key] = value;
            }
            await documentFactory.updateDocument(webSkel.currentUser.space.id, this._document);
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