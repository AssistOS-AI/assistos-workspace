export class AddSpaceModal {
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    beforeRender() {
    }

    async addSpace(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if (formData.isValid) {
            const spaceName=formData.data.name;
            try {
                await assistOS.createSpace(spaceName);
                assistOS.UI.closeModal(_target);

            } catch (error) {
                showApplicationError('Failed Creating Space', `Encountered an Issue creating the space ${formData.data.name}`,
                    assistOS.UI.sanitize(error.message));
            }
        }
    }
}