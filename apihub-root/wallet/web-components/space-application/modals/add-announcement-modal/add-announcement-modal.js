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
            const { title, text } = formInfo.data;
            const announcementData = {
                title:title,
                text:text,
            };
            const spaceModule =assistOS.loadModule("space");
            await spaceModule.addSpaceAnnouncement(assistOS.space.id,announcementData);
            assistOS.space.notifyObservers(assistOS.space.getNotificationId());
            assistOS.UI.closeModal(_target);
        }
    }
}