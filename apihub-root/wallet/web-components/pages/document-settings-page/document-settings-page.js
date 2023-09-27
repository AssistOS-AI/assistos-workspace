import {DocumentModel, extractFormInformation} from "../../../imports.js";
import {DocumentFactory} from "../../../core/factories/documentFactory.js";

export class documentSettingsPage {
    constructor(element) {
        this.element = element;
        let url = window.location.hash;
        this.id = parseInt(url.split('/')[1]);
        this._document = webSkel.space.getDocument(this.id);
        if(this._document) {
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        } else {
            console.log(`this _document doesnt exist: docId: ${this.id}`);
        }
        this.updateState = (spaceData)=> {
            this.invalidate();
        }
        this._document.observeChange(this._document.getNotificationId(), this.updateState);
        this.singularToPlural = { personality: "personalities", llm: "llms"};
        this.pluralToSingular = { personalities: "personality", llms: "llm"};
    }

    beforeRender() {
        let llmsHTML = "";
        let personalitiesHTML = "";
        let promptsHTML = "";

        // caz 1 no llms
        // caz 2 there is a selected llm already
        // caz 3 no selected llm

        const dictionary = { llms: "llm", personalities: "personality" };
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
    }

    async saveSettings(_target) {
        const updateOption = (optionKey, optionValue) => {
            if(Number.isNaN(parseInt(optionValue))) {
                return true;
            }
            let optionId = parseInt(optionValue);
            let optionIndex = webSkel.space.settings[optionKey].findIndex(option => option.id === optionId);
            if(optionIndex !== -1) {
                if(this._document.settings[this.pluralToSingular[optionKey]] !== webSkel.space.settings[optionKey][optionIndex]) {
                    this._document.settings[this.pluralToSingular[optionKey]] = webSkel.space.settings[optionKey][optionIndex];
                }
                return true;
            }
            return false;
        }
        let formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            for (const [key, value] of Object.entries(formInfo.data)) {
                if(!updateOption(this.singularToPlural[key], value)) {
                    await showApplicationError(`Error updating option`, `Option ${key} index not found`, `Option ${key}: value ${value}`);
                }
            }
            await DocumentFactory.storeDocument(currentSpaceId, this._document);
        }
        else {
            await showApplicationError(`Error at submitting form`, `Form invalid`, `Form with target: ${_target}`);
        }
    }

    openEditTitlePage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-title`);
    }

    openEditAbstractPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-abstract`);
    }

    openDocumentSettingsPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/settings`);
    }

    openBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/brainstorming`);
    }

    openViewPage() {
        webSkel.changeToStaticPage(`documents/${this.id}`);
    }
}