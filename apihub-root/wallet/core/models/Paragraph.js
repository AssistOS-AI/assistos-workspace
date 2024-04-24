export class Paragraph {
    constructor(paragraphData) {
        this.text = paragraphData.text;
        this.position = paragraphData.position;
        this.id = paragraphData.id || assistOS.services.generateId();
        this.mainIdea = paragraphData.mainIdea || "";
        this.alternativeParagraphs = paragraphData.alternativeParagraphs || [];
    }
    simplifyParagraph() {
        return {
            text:this.text,
            mainIdea:this.mainIdea
        }
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
    selectAlternativeParagraph(alternativeParagraphId){
        let clone = Object.assign({}, this);

        let alternativeParagraph = this.getAlternativeParagraph(alternativeParagraphId);
        this.text = alternativeParagraph.text;
        this.id = alternativeParagraph.id;
        this.mainIdea = alternativeParagraph.mainIdea;

        let alternativeParagraphIndex = this.alternativeParagraphs.findIndex(paragraph => paragraph.id === alternativeParagraph.id);
        this.alternativeParagraphs.splice(alternativeParagraphIndex, 1);
        this.alternativeParagraphs.splice(alternativeParagraphIndex,0,{
            id: clone.id,
            text: clone.text,
            mainIdea: clone.mainIdea
        });
    }
}