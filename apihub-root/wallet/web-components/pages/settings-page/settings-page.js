const userModule = require('assistos').loadModule('user', {});
export class SettingsPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate(async () => {
            this.users = await userModule.getUsersSecretsExist(assistOS.space.id);
            this.apiKeys = assistOS.space.apiKeys
        });
    }

    beforeRender() {
        let stringHTML = "";
        let apiKeysContainer = "";
        for (let user of this.users) {
            stringHTML += `<div class="row">
            <div class="username">${user.name}</div>
            <div class="delete-credentials" data-local-action="deleteGITCredentials ${user.id}">
                <img src="./wallet/assets/icons/trash-can.svg" alt="trash-icon">
            </div>
        </div>`;
        }
        this.apiKeysContainers=""
        Object.keys(this.apiKeys).forEach(keyType => {
            apiKeysContainer=""
            assistOS.space.apiKeys[keyType].forEach(keyObj => {
                apiKeysContainer +=
                    `<apikey-unit data-presenter="apikey-unit" data-key-id="${keyObj.id}" data-key-type="${keyType}"> </apikey-unit>`
            })
            this.apiKeysContainers+=apiKeysContainer
        })

        this.tableRows = stringHTML;
    }

    afterRender() {
        let deleteButton = this.element.querySelector("#delete-space-button");
        if (assistOS.user.id !== assistOS.space.id) {
            deleteButton.style.display = "block";
        } else {
            deleteButton.style.display = "none";
        }
        this.setContext();
    }
    setContext() {
        assistOS.context = {
            "location and available actions": "We are in the Settings page in OS. Here you can see if a user has configured his GIT credentials and LLM API keys. You can also delete them and delete the space.",
            "available items": {
                users:JSON.stringify(this.users),
                apiKeys:JSON.stringify(this.apiKeys)
            }
        }
    }
    async deleteSpace() {
        return await assistOS.callFlow("DeleteSpace", { spaceId: assistOS.space.id });
    }

    async deleteGITCredentials(_target, userId) {
        await assistOS.storage.storeGITCredentials(assistOS.space.id, userId, JSON.stringify({
            delete: true, secretName: "username"
        }));
        await assistOS.storage.storeGITCredentials(assistOS.space.id, userId, JSON.stringify({
            delete: true, secretName: "token"
        }));
        this.invalidate(async () => {
            this.users = JSON.parse(await assistOS.services.getUsersSecretsExist());
        });
    }

    async deleteKey(_eventTarget) {
        const keyId = assistOS.UI.reverseQuerySelector(_eventTarget, 'apikey-unit').getAttribute('data-key-id');
        const keyType = assistOS.UI.reverseQuerySelector(_eventTarget, 'apikey-unit').getAttribute('data-key-type');
        await assistOS.storage.deleteKey(assistOS.space.id,keyType, keyId);
        this.apiKeys[keyType]=this.apiKeys[keyType].filter(key=>key.id!==keyId);
        this.invalidate();
    }
    async addKey(){
        await assistOS.UI.showModal( "add-apikey-modal");
    }
    editKey(_eventTarget) {
        const keyId = assistOS.UI.reverseQuerySelector(_eventTarget, 'apikey-unit').getAttribute('data-id');
    }


}