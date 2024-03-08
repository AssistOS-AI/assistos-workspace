export class SettingsPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate(async () => {
            this.users = JSON.parse(await webSkel.appServices.getUsersSecretsExist());
            this.apiKeys = webSkel.currentUser.space.apiKeys
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
            webSkel.currentUser.space.apiKeys[keyType].forEach(keyObj => {
                apiKeysContainer +=
                    `<apikey-unit data-presenter="apikey-unit" data-key-id="${keyObj.id}" data-key-type="${keyType}"> </apikey-unit>`
            })
            this.apiKeysContainers+=apiKeysContainer
        })

        this.tableRows = stringHTML;
    }

    afterRender() {
        let deleteButton = this.element.querySelector("#delete-space-button");
        if (webSkel.currentUser.id !== webSkel.currentUser.space.id) {
            deleteButton.style.display = "block";
        } else {
            deleteButton.style.display = "none";
        }
    }

    async deleteSpace() {
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteSpace");
        return await webSkel.appServices.callFlow(flowId, webSkel.currentUser.space.id);
    }

    async deleteGITCredentials(_target, userId) {
        await storageManager.storeGITCredentials(webSkel.currentUser.space.id, userId, JSON.stringify({
            delete: true, secretName: "username"
        }));
        await storageManager.storeGITCredentials(webSkel.currentUser.space.id, userId, JSON.stringify({
            delete: true, secretName: "token"
        }));
        this.invalidate(async () => {
            this.users = JSON.parse(await webSkel.appServices.getUsersSecretsExist());
        });
    }

    async deleteKey(_eventTarget) {
        debugger
        const keyId = webSkel.reverseQuerySelector(_eventTarget, 'apikey-unit').getAttribute('data-key-id');
        const keyType = webSkel.reverseQuerySelector(_eventTarget, 'apikey-unit').getAttribute('data-key-type');
        await storageManager.deleteKey(webSkel.currentUser.space.id,keyType, keyId);
        this.apiKeys[keyType]=this.apiKeys[keyType].filter(key=>key.id!==keyId);
        this.invalidate();
    }
    async addKey(){
        await webSkel.showModal( "add-apikey-modal", {presenter: "add-apikey-modal"});
    }
    editKey(_eventTarget) {
        const keyId = webSkel.reverseQuerySelector(_eventTarget, 'apikey-unit').getAttribute('data-id');
    }


}