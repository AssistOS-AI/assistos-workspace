const userModule = require('assistos').loadModule('user', {});
const spaceModule = require('assistos').loadModule('space', {});
export class SettingsPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.spaceSettingsTab = "active";
        this.collaboratorsTab = "";
        this.getAPIKeys = async () => {
            this.apiKeys = await spaceModule.getAPIKeysMetadata(assistOS.space.id);
        }
        this.invalidate(this.getAPIKeys);
    }

    async beforeRender() {
        if(this.spaceSettingsTab === "active"){
            let apiKeys = "";
            for(let company of Object.keys(this.apiKeys)){
                apiKeys +=
                    `<div class="table-line pointer" data-local-action="editKey ${company} ${this.apiKeys[company].hasOwnProperty("userId")}">
                            <div class="company-name">${company}</div>
                            <div class="api-key">${this.apiKeys[company].APIKey || "No key set"}</div>`;
                if(this.apiKeys[company].APIKey){
                    apiKeys += `<svg class="pointer" data-local-action="deleteAPIKey ${company}" width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.3974 3.02564H13.6154V2.26923C13.6154 1.66739 13.3763 1.09021 12.9507 0.664642C12.5252 0.239079 11.948 0 11.3462 0H6.80769C6.20585 0 5.62867 0.239079 5.2031 0.664642C4.77754 1.09021 4.53846 1.66739 4.53846 2.26923V3.02564H0.75641C0.555798 3.02564 0.363402 3.10533 0.221548 3.24719C0.0796931 3.38904 0 3.58144 0 3.78205C0 3.98266 0.0796931 4.17506 0.221548 4.31691C0.363402 4.45877 0.555798 4.53846 0.75641 4.53846H1.51282V18.1538C1.51282 18.5551 1.67221 18.9399 1.95592 19.2236C2.23962 19.5073 2.62442 19.6667 3.02564 19.6667H15.1282C15.5294 19.6667 15.9142 19.5073 16.1979 19.2236C16.4816 18.9399 16.641 18.5551 16.641 18.1538V4.53846H17.3974C17.598 4.53846 17.7904 4.45877 17.9323 4.31691C18.0742 4.17506 18.1538 3.98266 18.1538 3.78205C18.1538 3.58144 18.0742 3.38904 17.9323 3.24719C17.7904 3.10533 17.598 3.02564 17.3974 3.02564ZM7.5641 14.3718C7.5641 14.5724 7.48441 14.7648 7.34255 14.9067C7.2007 15.0485 7.0083 15.1282 6.80769 15.1282C6.60708 15.1282 6.41468 15.0485 6.27283 14.9067C6.13097 14.7648 6.05128 14.5724 6.05128 14.3718V8.32051C6.05128 8.1199 6.13097 7.9275 6.27283 7.78565C6.41468 7.64379 6.60708 7.5641 6.80769 7.5641C7.0083 7.5641 7.2007 7.64379 7.34255 7.78565C7.48441 7.9275 7.5641 8.1199 7.5641 8.32051V14.3718ZM12.1026 14.3718C12.1026 14.5724 12.0229 14.7648 11.881 14.9067C11.7392 15.0485 11.5468 15.1282 11.3462 15.1282C11.1455 15.1282 10.9531 15.0485 10.8113 14.9067C10.6694 14.7648 10.5897 14.5724 10.5897 14.3718V8.32051C10.5897 8.1199 10.6694 7.9275 10.8113 7.78565C10.9531 7.64379 11.1455 7.5641 11.3462 7.5641C11.5468 7.5641 11.7392 7.64379 11.881 7.78565C12.0229 7.9275 12.1026 8.1199 12.1026 8.32051V14.3718ZM12.1026 3.02564H6.05128V2.26923C6.05128 2.06862 6.13097 1.87622 6.27283 1.73437C6.41468 1.59251 6.60708 1.51282 6.80769 1.51282H11.3462C11.5468 1.51282 11.7392 1.59251 11.881 1.73437C12.0229 1.87622 12.1026 2.06862 12.1026 2.26923V3.02564Z" fill="#3478C6"/>
                            </svg>
                </div>`
                } else {
                    apiKeys += `<div></div></div>`;
                }
            }
            this.tabContent = `<div class="apikeys-table">
                <div class="table-header">
                    <div class="table-name">
                        API Keys
                    </div>
                </div>
                <div class="table-content">
                    <div class="table-labels">
                        <div class="table-label company-name">Type</div>
                        <div class="table-label api-key">Value</div>
                        <div class="table-label"></div>
                    </div>
                    <div class="table-rows">${apiKeys}</div>
                </div>
            </div>`;
        } else {
            let collaborators = await spaceModule.getSpaceCollaborators(assistOS.space.id);
            let collaboratorsHTML = "";
            for(let collaborator of collaborators){
                collaboratorsHTML += `<div class="collaborator-item">
                                        <div class="collaborator-email"> ${collaborator.email}</div>
                                        <div class="collaborator-role"> ${collaborator.role}</div>
                                        <div class="delete-collaborator">
                                            <img class="trash-icon" data-local-action="deleteCollaborator ${collaborator.id} ${collaborator.email}" src="./wallet/assets/icons/trash-can.svg" alt="trash">
                                        </div>
                                     </div>`;
            }
            this.tabContent = `<div class="collaborators-section">
                                    <button data-local-action="addCollaborator" class="general-button add-collaborator-button">Add Collaborator</button>
                                    <span class="collaborators-label-email">Email</span>
                                    <span class="collaborators-label-role">Role</span>
                                    <span class="collaborators-label-delete">Delete</span>
                                    <div class="collaborators-list">
                                        ${collaboratorsHTML}
                                    </div>
                               </div>`;
        }
    }
    addCollaborator(){
        assistOS.UI.showModal("add-space-collaborator-modal");
    }
    async deleteCollaborator(button, userId, email){
        let message= `Are you sure you want to delete collaborator ${email}?`;
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message: message}, true);
        if(confirmation){
            let message = await spaceModule.deleteSpaceCollaborator(assistOS.space.id, userId);
            if(message){
                alert(message);
            } else {
                this.invalidate();
            }
        }
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
    changeTab(_eventTarget, tabName) {
        if(tabName === "spaceSettingsTab"){
            this.spaceSettingsTab = "active";
            this.collaboratorsTab = "";
        } else {
            this.spaceSettingsTab = "";
            this.collaboratorsTab = "active";
        }
        this.invalidate();
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
        let message = `Are you sure you want to delete the space: ${assistOS.space.name}?`;
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if(confirmation){
            let message = await assistOS.loadifyComponent(this.element, async ()=>{
                return await spaceModule.deleteSpace(assistOS.space.id);
            });
            if(message){
                await showApplicationError("Error deleting space", message, "");
            } else {
                window.location.reload();
            }
        }
    }

    async deleteAPIKey(_eventTarget, type) {
        await userModule.deleteAPIKey(assistOS.space.id, type);
        this.invalidate(this.getAPIKeys);
    }

    async editKey(_eventTarget, type, hasUserId){
        let confirmation = await assistOS.UI.showModal( "edit-apikey-modal", {type: type, ["has-user-id"]: hasUserId}, true);
        if(confirmation){
            this.invalidate(this.getAPIKeys);
        }
    }
}
