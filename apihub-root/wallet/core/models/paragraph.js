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

    getAlternativeParagraph(id){
        return this.alternativeParagraphs.find(paragraph => paragraph.id === id);
    }

    updateAlternativeParagraph(id, text){
        let paragraph = this.getAlternativeParagraph(id);
        if(paragraph){
            paragraph.text = text;
        }else {
            console.error(`Failed to find alternative paragraph with id: ${id}`);
        }
    }

    deleteAlternativeParagraph(id){
        const index = this.alternativeParagraphs.findIndex(paragraph => paragraph.id === id);
        if (index !== -1) {
            this.alternativeParagraphs.splice(index, 1);
        }else {
            console.warn(`Failed to find alternative paragraph with id: ${id}`);
        }
    }
}