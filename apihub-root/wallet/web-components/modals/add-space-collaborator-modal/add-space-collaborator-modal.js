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
                    <option value="admin">Admin</option>
                    <option value="member" selected>Member</option>
                </select>
            </div>`;
        addCollabBtn.insertAdjacentHTML("beforebegin", newCollabUnit);
    }

    async inviteCollaborators(_target) {
        debugger
        let formData = await assistOS.UI.extractFormInformation(_target);
        if (formData.isValid) {
            try {
                let collaboratorEmails = [];
                Object.keys(formData.data).forEach(key => {
                    if (key.includes('email')) {
                        collaboratorEmails.push(formData.data[key]);
                    }
                });
                await assistOS.inviteCollaborators(collaboratorEmails);
                assistOS.UI.closeModal(_target);
            } catch (error) {
                await showApplicationError('Failed Inviting Collaborators', `Encountered an Issue inviting the collaborators`,
                    error);
            }
        }
    }

}