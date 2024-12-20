export class AddSpaceCollaboratorModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.spaceName = assistOS.space.name;
        this.lastEmailCount = 1;
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    addEmailField(_target) {
        const addCollabBtn = this.element.querySelector('.add-collab');
        this.lastEmailCount += 1;
        let newCollabUnit = `
            <div class="collab-unit">
                <input type="email" class="form-input" id="email${this.lastEmailCount}" name="email${this.lastEmailCount}" placeholder="Enter email address" required>
                <select class="select-role" id="role${this.lastEmailCount}" name="role${this.lastEmailCount}" required>
                    <option value="member" selected>Member</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                </select>
            </div>`;
        addCollabBtn.insertAdjacentHTML("beforebegin", newCollabUnit);
    }

    async inviteCollaborators(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if (formData.isValid) {
            try {
                let collaborators = [];
                for (const key in formData.data) {
                    if (key.startsWith("email")) {
                        const index = key.replace("email", "");
                        const email = formData.data[key];
                        const role = formData.data[`role${index}`];
                        if (role) {
                            collaborators.push({ email, role });
                        }
                    }
                }

                let existingCollaborators = await assistOS.inviteCollaborators(collaborators);
                if(existingCollaborators.length > 0){
                    await showApplicationError("Collaborators already exist", `${existingCollaborators.join(', ')} already exist in the space`, "");
                }
                assistOS.UI.closeModal(_target);
            } catch (error) {
                await showApplicationError('Failed Inviting Collaborators', `Encountered an Issue inviting the collaborators`,
                    assistOS.UI.sanitize(error.message));
            }
        }
    }

}