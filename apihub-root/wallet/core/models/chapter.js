import { Paragraph } from './paragraph.js';

export class Chapter {
    constructor(chapterData) {
        this.title = chapterData.title;
        this.id = chapterData.id;
        this.visibility = "show";
        this.paragraphs = [];
        if(chapterData.paragraphs && chapterData.paragraphs.length > 0) {
            for(let i = 0; i < chapterData.paragraphs.length; i++) {
                if(chapterData.paragraphs[i] !== undefined) {
                    this.paragraphs.push(new Paragraph(chapterData.paragraphs[i]));
                }
            }
        }
        this.currentParagraphId = null;
    }

    getNotificationId() {
        return `doc:${this.id}`;
    }

    toString() {
        return `${this.title}\n${this.paragraphs.map(paragraph => paragraph.toString()).join("\n")}`;
    }

    addParagraph(paragraphData){
        this.paragraphs.push(new Paragraph(paragraphData));
    }

    addParagraphs(paragraphsData){
        for(let paragraph of paragraphsData){
            let paragraphData = {
                id: webSkel.servicesRegistry.UtilsService.generateId(),
                text:paragraph
            }
            this.paragraphs.push(new Paragraph(paragraphData));
        }
    }
    deleteParagraph(paragraphId) {
        let paragraphIndex = this.paragraphs.findIndex(paragraph => paragraph.id === paragraphId);
        if(paragraphIndex !== -1) {
            this.paragraphs.splice(paragraphIndex, 1);
        }else{
            console.error("Attempting to delete paragraph that no longer exists in this chapter.");
        }
    }

    getParagraph(paragraphId) {
        return this.paragraphs.find(paragraph => paragraph.id === paragraphId)||null;
    }

    swapParagraphs(paragraphId1, paragraphId2) {
        let index1 = this.paragraphs.findIndex(paragraph => paragraph.id === paragraphId1);
        let index2 = this.paragraphs.findIndex(paragraph => paragraph.id === paragraphId2);
        if(index1 !== -1 && index2 !== -1) {
            [this.paragraphs[index1], this.paragraphs[index2]] = [this.paragraphs[index2], this.paragraphs[index1]];
            return true;
        }else{
            console.error("Attempting to swap paragraphs that no longer exist in this chapter.");
            return false;
        }
    }
}