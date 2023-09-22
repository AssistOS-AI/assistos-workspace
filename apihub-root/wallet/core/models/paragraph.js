export class Paragraph {
    constructor(paragraphData) {
        this.text = paragraphData.text;
        this.id = paragraphData.id;
    }

    getNotifyId(chapterId) {
        return `doc:${chapterId}:${this.id}`;
    }

    toString() {
        return this.text;
    }
}