const spaceModule = require('assistos').loadModule('space', {});

export class KeysTab {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.getAPIKeys = async () => {
            this.apiKeys = await spaceModule.getAPIKeysMasked(assistOS.space.id);
        };
        this.invalidate(this.getAPIKeys);
    }
    beforeRender() {
        let apiKeys = "";
        for (let provider of Object.keys(this.apiKeys)) {
            apiKeys +=
                `<div class="table-line pointer" data-local-action="editKey ${provider} ${this.apiKeys[provider].hasOwnProperty("userId")}">
                            <div class="provider-name">${provider}</div>
                            <div class="api-key">${this.apiKeys[provider].APIKey || "No key set"}</div>`;
            if (this.apiKeys[provider].APIKey) {
                apiKeys += `
                            <img class="trash-icon black-icon" data-local-action="deleteAPIKey ${provider}" src="./wallet/assets/icons/trash-can.svg" alt="trash">
                          
                </div>`
            } else {
                apiKeys += `<div></div></div>`;
            }
        }
        this.apiKeys = apiKeys;
    }
    async deleteAPIKey(_eventTarget, type) {
        await spaceModule.editAPIKey(assistOS.space.id, type);
        this.invalidate(this.getAPIKeys);
    }

    async editKey(_eventTarget, type, hasUserId) {
        let confirmation = await assistOS.UI.showModal("edit-apikey-modal", {
            type: type,
            ["has-user-id"]: hasUserId
        }, true);
        if (confirmation) {
            this.invalidate(this.getAPIKeys);
        }
    }
}