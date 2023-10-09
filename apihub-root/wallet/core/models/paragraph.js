export class Paragraph {
    constructor(paragraphData) {
        this.text = paragraphData.text;
        this.id = paragraphData.id;
    }
    getNotificationId(chapterId) {
        return `doc:${chapterId}:${this.id}`;
    }
    toString() {
        return this.text;
    }

    updateText(paragraphText) {
        this.text = paragraphText;
    }
}