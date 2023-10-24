export class Paragraph {
    constructor(paragraphData) {
        this.text = paragraphData.text;
        this.id = paragraphData.id;
        this.mainIdea = paragraphData.mainIdea || "";
        this.alternativeParagraphs = paragraphData.alternativeParagraphs || [];
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

    getMainIdea(){
        return this.mainIdea;
    }

    setMainIdea(idea){
        this.mainIdea = idea;
    }

    addAlternativeParagraph(altParagraphData){
        this.alternativeParagraphs.push(altParagraphData);
    }
}