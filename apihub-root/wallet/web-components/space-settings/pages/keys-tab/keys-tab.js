const spaceModule = assistOS.loadModule("space");

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
        this.secretsHTML = Object.entries(this.secrets).map(([key, secret]) => `
    <tr class="pointer" data-local-action="editKey ${key}">
      <td>${key}</td>
      <td>${secret || 'No value set'}</td>
      <td class="actions-button">
            <img src="./wallet/assets/icons/trash-can.svg" data-local-action="deleteAPIKey ${key}" alt="delete">
        </td>
    </tr>`).join('')
    }

    afterRender() {
        this.element.querySelector('#table-secrets tbody').innerHTML = this.secretsHTML
        this.element.querySelectorAll('.actions-button')
            .forEach(b => {b.style.marginRight = '46px'});
    }

    async deleteAPIKey(_eventTarget, secretKey) {
        try {
            let message = `Are you sure you want to delete the secret key ${secretKey}? This action cannot be undone.`;
            let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
            alert("to be done")
            if(!confirmation) {
                return;
            }
            //await spaceModule.deleteSecret(assistOS.space.id, secretKey);
            //this.invalidate(this.getSecrets);
        } catch (e) {
            let jsonMessage = JSON.parse(e.message);
            assistOS.showToast(jsonMessage.message, "error", 5000);
        }
    }

    async editKey(_eventTarget, key) {
        let confirmation = await assistOS.UI.showModal("edit-apikey-modal", {
            key: key
        }, true);
        if (confirmation) {
            this.invalidate(this.getSecrets);
        }
    }

    async addSecret() {
        let confirmation = await assistOS.UI.showModal("add-key-modal", {}, true);
        if (confirmation) {
            this.invalidate(this.getSecrets);
        }
    }
    async restartServerless(){
        try {
            await spaceModule.restartServerless(assistOS.space.id);
            assistOS.showToast("Serverless restarted successfully", "success", 5000);
            let chatPage = document.querySelector("chat-page");
            chatPage.webSkelPresenter.invalidate();
        } catch (e) {
            let jsonMessage = JSON.parse(e.message);
            assistOS.showToast(jsonMessage.message, "error", 5000);
        }
    }
}