const userModule = require('assistos').loadModule('user', {});
const spaceModule = require('assistos').loadModule('space', {});
export class SettingsPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.spaceSettingsTab = "active";
        this.collaboratorsTab = "";
        this.preferencesTab = "";
        this.getAPIKeys = async () => {
            this.apiKeys = await spaceModule.getAPIKeysMetadata(assistOS.space.id);
        };
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
                    apiKeys += `
                            <img class="trash-icon black-icon" data-local-action="deleteAPIKey ${company}" src="./wallet/assets/icons/trash-can.svg" alt="trash">
                          
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
            </div>
            <div class="tab-footer">
                <button class="general-button" id="delete-space-button" data-local-action="deleteSpace">Delete Space</button>
            </div>`
            ;

        } else if(this.collaboratorsTab === "active"){
            let collaborators = await spaceModule.getSpaceCollaborators(assistOS.space.id);
            let collaboratorsHTML = "";
            for(let collaborator of collaborators){
                collaboratorsHTML += `<div class="collaborator-item">
                                        <div class="collaborator-email"> ${collaborator.email}</div>
                                        <select class="collaborator-role" data-user-id="${collaborator.id}">
                                            <option value="member" ${collaborator.role === "member" ? "selected" : ""}>Member</option>
                                            <option value="admin" ${collaborator.role === "admin" ? "selected" : ""}>Admin</option>
                                            <option value="owner" ${collaborator.role === "owner" ? "selected" : ""}>Owner</option>
                                        </select>
                                        <div class="delete-collaborator">
                                            <img class="trash-icon black-icon" data-local-action="deleteCollaborator ${collaborator.id} ${collaborator.email}" src="./wallet/assets/icons/trash-can.svg" alt="trash">
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
        }else {
            const selectedParagraphSize = parseInt(localStorage.getItem("document-font-size"), 10) || 12;

            const selectedFont = localStorage.getItem("document-font-family") || "Arial";
            const selectedColor = localStorage.getItem("document-font-color") || "#000000";

            const selectedDocumentTitleSize = parseInt(localStorage.getItem("document-title-font-size"), 10) ?? 24;
            const selectedChapterTitleSize = parseInt(localStorage.getItem("chapter-title-font-size"), 10) ?? 20;
            const selectedAbstractSize = parseInt(localStorage.getItem("abstract-font-size"), 10) ?? 14;
            const selectedParagraphIndent=parseInt(localStorage.getItem("document-indent-size"), 10) ?? 12;
            this.tabContent = `
        <div id="preferences-container">
            <div class="preferences-section">
                <div class="preferences-header">
                    <span class="preferences-label">Document</span>
                </div>
                <div class="preferences-content">
                    <div class="preferences-list">
                    <div class="preference">
                            <label for="document-title-font-size">Document Title Font Size</label>
                            <select id="document-title-font-size" name="document-title-font-size">
                                ${[8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]
                .map(size => `
                                        <option value="${size}" ${size === selectedDocumentTitleSize ? "selected" : ""}>${size}px</option>
                                    `)
                .join("")}
                            </select>
                        </div>
                          <div class="preference">
                            <label for="document-chapter-title-font-size">Chapter Title Font Size</label>
                            <select id="document-chapter-title-font-size" name="document-chapter-title-font-size">
                                ${[8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]
                .map(size => `
                                        <option value="${size}" ${size === selectedChapterTitleSize ? "selected" : ""}>${size}px</option>
                                    `)
                .join("")}
                            </select>
                        </div>
                         <div class="preference">
                            <label for="document-abstract-font-size">Abstract Font Size</label>
                            <select id="document-abstract-font-size" name="document-abstract-font-size">
                                ${[8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]
                .map(size => `
                                        <option value="${size}" ${size === selectedAbstractSize ? "selected" : ""}>${size}px</option>
                                    `)
                .join("")}
                            </select>
                        </div>
                        <div class="preference">
                            <label for="document-font-size">Paragraph Font Size</label>
                            <select id="document-font-size" name="document-font-size">
                                ${[8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]
                .map(size => `
                                        <option value="${size}" ${size === selectedParagraphSize ? "selected" : ""}>${size}px</option>
                                    `)
                .join("")}
                            </select>
                        </div>
                            <div class="preference">
                            <label for="document-indent-size">Paragraph Indentation</label>
                            <select id="document-indent-size" name="document-indent-size">
                                ${[0,2,4,6,8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]
                .map(size => `
                                        <option value="${size}" ${size === selectedParagraphIndent ? "selected" : ""}>${size}px</option>
                                    `)
                .join("")}
                            </select>
                        </div>
                        <div class="preference">
                            <label for="document-font-family">Font Family</label>
                            <select id="document-font-family" name="document-font-family">
                                ${["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana"]
                .map(font => `
                                        <option value="${font}" ${font === selectedFont ? "selected" : ""}>${font}</option>
                                    `)
                .join("")}
                            </select>
                        </div>
                        <div class="preference">
                            <label for="document-font-color">Font Color</label>
                            <input type="color" id="document-font-color" name="document-font-color" value="${selectedColor}">
                        </div>
                    </div>
                </div>
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
        this.element.addEventListener("change", (event) => {
            const id = event.target.id;
            if (id === "document-font-size") {
                localStorage.setItem("document-font-size", event.target.value);
            } else if (id === "document-font-family") {
                localStorage.setItem("document-font-family", event.target.value);
            } else if (id === "document-font-color") {
                localStorage.setItem("document-font-color", event.target.value);
            }else if (id === "document-title-font-size") {
                localStorage.setItem("document-title-font-size", event.target.value);
            }else if (id === "document-chapter-title-font-size") {
                localStorage.setItem("chapter-title-font-size", event.target.value);
            }else if(id === "document-abstract-font-size"){
                localStorage.setItem("abstract-font-size", event.target.value);
            }else if(id === "document-indent-size"){
                localStorage.setItem("document-indent-size", event.target.value);
            }
        });
        if(this.collaboratorsTab === "active"){
            let collaboratorsRoles = this.element.querySelectorAll(".collaborator-role");
            for(let role of collaboratorsRoles){
                role.addEventListener("change", async (e)=>{
                    let userId = e.target.getAttribute("data-user-id");
                    let role = e.target.value;
                    let message = await spaceModule.setSpaceCollaboratorRole(assistOS.space.id, userId, role);
                    if(message){
                        alert(message);
                    }
                    this.invalidate();
                });
            }
        }
    }
    changeTab(_eventTarget, tabName) {
        if(tabName === "spaceSettingsTab"){
            this.spaceSettingsTab = "active";
            this.collaboratorsTab = "";
            this.preferencesTab = "";
        } else if(tabName === "collaboratorsTab"){
            this.collaboratorsTab = "active";
            this.spaceSettingsTab = "";
            this.preferencesTab = "";
        }else{
            this.preferencesTab = "active";
            this.spaceSettingsTab = "";
            this.collaboratorsTab = "";
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
            let currentSpaceId;
            let message = await assistOS.loadifyComponent(this.element, async ()=>{
                let message = await spaceModule.deleteSpace(assistOS.space.id);
                currentSpaceId = await userModule.getCurrentSpaceId(assistOS.user.email);
                return message;
            });
            if(message){
                await showApplicationError("Error deleting space", message, "");
            } else {
                window.location.href = window.location.href.split("#")[0] + `#${currentSpaceId}`;
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
