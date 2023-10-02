export class Announcement {
    constructor(announcementData) {
        this.title = announcementData.title;
        this.id = announcementData.id;
        this.date = announcementData.date;
        this.text = announcementData.text;
    }
    static async storeAnnouncement(spaceId, announcement) {
        await storageManager.storeObject(spaceId, "status", "announcements", JSON.stringify(announcement));
    }
}