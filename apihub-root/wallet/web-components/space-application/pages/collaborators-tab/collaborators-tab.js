const spaceModule = require('assistos').loadModule('space', {});
export class CollaboratorsTab {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    async beforeRender() {
        let collaborators = await spaceModule.getCollaborators(assistOS.space.id);
        let collaboratorsHTML = "";
        for (let collaborator of collaborators) {
            collaboratorsHTML += `<div class="collaborator-item">
                                        <div class="collaborator-email"> ${collaborator.email}</div>
                                        <select class="collaborator-role" data-user-email="${collaborator.email}">
                                            <option value="member" ${collaborator.role === "member" ? "selected" : ""}>Member</option>
                                            <option value="admin" ${collaborator.role === "admin" ? "selected" : ""}>Admin</option>
                                            <option value="owner" ${collaborator.role === "owner" ? "selected" : ""}>Owner</option>
                                        </select>
                                        <div class="delete-collaborator">
                                            <img class="trash-icon black-icon" data-local-action="removeCollaborator ${collaborator.email}" src="./wallet/assets/icons/trash-can.svg" alt="trash">
                                        </div>
                                     </div>`;
        }
        this.collaboratorsHTML = collaboratorsHTML
    }
    afterRender(){
        let collaboratorsRoles = this.element.querySelectorAll(".collaborator-role");
        for (let role of collaboratorsRoles) {
            role.addEventListener("change", async (e) => {
                let email = e.target.getAttribute("data-user-email");
                let role = e.target.value;
                let message = await spaceModule.setCollaboratorRole(assistOS.space.id, email, role);
                if (message) {
                    alert(message);
                }
                this.invalidate();
            });
        }
    }
    addCollaborator() {
        assistOS.UI.showModal("add-space-collaborator-modal");
    }

    async removeCollaborator(button, email) {
        let message = `Are you sure you want to delete collaborator ${email}?`;
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message: message}, true);
        if (confirmation) {
            let message = await spaceModule.removeCollaborator(assistOS.space.id, email);
            if (message) {
                alert(message);
            } else {
                this.invalidate();
            }
        }
    }
}