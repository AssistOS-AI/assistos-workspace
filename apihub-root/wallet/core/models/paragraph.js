export class Paragraph {
    constructor(paragraphData) {
        this.text = paragraphData.text;
        this.id = paragraphData.id;
        this.mainIdea = paragraphData.mainIdea || "";
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