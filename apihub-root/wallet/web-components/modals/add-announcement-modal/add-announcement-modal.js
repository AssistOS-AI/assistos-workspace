export class AddAnnouncementModal {
    constructor(element,invalidate) {
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async addAnnouncementSubmitForm(_target) {
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        if(formInfo.isValid) {
            await assistOS.callFlow("AddAnnouncement", {
                title: formInfo.data.title,
                text: formInfo.data.text
            });
            assistOS.space.notifyObservers(assistOS.space.getNotificationId());
            assistOS.UI.closeModal(_target);
        }
    }
}