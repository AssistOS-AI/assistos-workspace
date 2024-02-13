export class Announcement {
    constructor(announcementData) {
        this.title = announcementData.title;
        this.id = announcementData.id || webSkel.appServices.generateId();
        this.date = announcementData.date;
        this.text = announcementData.text;
    }

    simplify(){
        return {
            title: this.title,
            id: this.id,
            date: this.date
        }
    }
}