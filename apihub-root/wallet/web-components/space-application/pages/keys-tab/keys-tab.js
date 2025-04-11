const spaceModule = require('assistos').loadModule('space', {});

export class KeysTab {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.getSecrets = async () => {
            this.secrets = await spaceModule.getSecretsMasked(assistOS.space.id);
        };
        this.invalidate(this.getSecrets);
    }
    beforeRender() {
        let secretsHTML = "";
        for (let secretKey of Object.keys(this.secrets)) {
            let secret = this.secrets[secretKey];
            secretsHTML +=
                `<div class="table-line pointer" data-local-action="editKey ${secret.name} ${secretKey}">
                            <div class="secret-name">${secret.name}</div>
                            <div class="key">${secretKey}</div>
                            <div class="value">${secret.value || "No value set"}</div>
                            <div class="remaining-space">
                                <img class="trash-icon black-icon" data-local-action="deleteAPIKey ${secretKey}" src="./wallet/assets/icons/trash-can.svg" alt="trash">
                            </div>
                </div>`;
        }
        this.secretsHTML = secretsHTML;
    }
    async deleteAPIKey(_eventTarget, secretKey) {
        try {
            await spaceModule.deleteSecret(assistOS.space.id, secretKey);
            this.invalidate(this.getSecrets);
        } catch (e) {
            let jsonMessage = JSON.parse(e.message);
            assistOS.showToast(jsonMessage.message, "error", 5000);
        }
    }

    async editKey(_eventTarget, name, key) {
        let confirmation = await assistOS.UI.showModal("edit-apikey-modal", {
            name: name,
            key: key
        }, true);
        if (confirmation) {
            this.invalidate(this.getSecrets);
        }
    }
    async addSecret(){
        let confirmation = await assistOS.UI.showModal("add-key-modal", {}, true);
        if (confirmation) {
            this.invalidate(this.getSecrets);
        }
    }
}