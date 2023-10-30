export class Announcement {
    constructor(announcementData) {
        this.title = announcementData.title;
        this.id = announcementData.id || webSkel.getService("UtilsService").generateId();
        this.date = announcementData.date;
        this.text = announcementData.text;
    }
}