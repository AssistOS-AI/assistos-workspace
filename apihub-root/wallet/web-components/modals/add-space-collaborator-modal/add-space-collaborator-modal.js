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
        const form = this.element.querySelector('.modal-body .form-item');
        this.lastEmailCount += 1;
        let emailField = document.createElement("input");
        emailField.type = "email";
        emailField.placeholder = "Enter additional email address";
        emailField.className = "form-input";
        emailField.name = `email${this.additionalEmailsCount}`;
        emailField.id = `email${this.additionalEmailsCount}`;
        form.appendChild(emailField);
    }

    async inviteCollaborators(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if (formData.isValid) {
            try {
                let collaboratorEmails = [];
                Object.keys(formData.data).forEach(key => {
                    if (key.includes('email')||formData.data[key].trim()) {
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