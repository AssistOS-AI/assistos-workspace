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
    <tr>
      <td class="secret-name">${secret.name}</td>
      <td>${key}</td>
      <td>${secret.value || 'No value set'}</td>
      <td class="actions-button">
            <button class="options-container-button" data-local-action="editKey ${secret.name} ${key}">
                <svg width="6" height="20" viewBox="0 0 6 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M3 15.1504C3.54542 15.1504 4.07106 15.3399 4.48926 15.6826L4.66211 15.8379C5.10282 16.2786 5.34961 16.8767 5.34961 17.5C5.34961 18.0454 5.1601 18.5711 4.81738 18.9893L4.66211 19.1621C4.2214 19.6028 3.62326 19.8496 3 19.8496C2.45458 19.8496 1.92894 19.6601 1.51074 19.3174L1.33789 19.1621C0.89718 18.7214 0.650391 18.1233 0.650391 17.5C0.650391 16.9546 0.8399 16.4289 1.18262 16.0107L1.33789 15.8379C1.7786 15.3972 2.37674 15.1504 3 15.1504ZM3 7.65039C3.54542 7.65039 4.07106 7.8399 4.48926 8.18262L4.66211 8.33789C5.10282 8.7786 5.34961 9.37674 5.34961 10C5.34961 10.5454 5.1601 11.0711 4.81738 11.4893L4.66211 11.6621C4.2214 12.1028 3.62326 12.3496 3 12.3496C2.45458 12.3496 1.92894 12.1601 1.51074 11.8174L1.33789 11.6621C0.89718 11.2214 0.650391 10.6233 0.650391 10C0.650391 9.45458 0.8399 8.92894 1.18262 8.51074L1.33789 8.33789C1.7786 7.89718 2.37674 7.65039 3 7.65039ZM3 0.150391C3.54542 0.150391 4.07106 0.3399 4.48926 0.682617L4.66211 0.837891C5.10282 1.2786 5.34961 1.87674 5.34961 2.5C5.34961 3.04542 5.1601 3.57106 4.81738 3.98926L4.66211 4.16211C4.2214 4.60282 3.62326 4.84961 3 4.84961C2.45458 4.84961 1.92894 4.6601 1.51074 4.31738L1.33789 4.16211C0.89718 3.7214 0.650391 3.12326 0.650391 2.5C0.650391 1.95458 0.8399 1.42894 1.18262 1.01074L1.33789 0.837891C1.72348 0.452297 2.22965 0.214571 2.76758 0.161133L3 0.150391Z"
                        fill="#595959" stroke="#595959" stroke-width="0.3"/>
                </svg>
            </button>
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

    async addSecret() {
        let confirmation = await assistOS.UI.showModal("add-key-modal", {}, true);
        if (confirmation) {
            this.invalidate(this.getSecrets);
        }
    }
}