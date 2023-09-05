import { Paragraph } from '../../imports.js';

export class Chapter {
    constructor(title, chapterId, paragraphs) {
        this.title = title;
        this.id = chapterId;
        this.paragraphs = (paragraphs || []).map(paragraph => new Paragraph(paragraph.text, paragraph.id));
        this.currentParagraphId = paragraphs[0] ? paragraphs[0].id : null;
    }

    createParagraph(paragraphText){
        this.paragraphs.push(new Paragraph(paragraphText, this.paragraphs.length + 1));
    }

    getParagraph(paragraphId) {
        const paragraph = this.paragraphs.find(paragraph => paragraph.id === paragraphId);
        return paragraph || null;
    }

    deleteParagraph(paragraphId) {
        const index = this.paragraphs.findIndex(paragraph => paragraph.id === paragraphId);
        if (index !== -1) {
            this.paragraphs.splice(index, 1);
        }
    }

    changeParagraphOrder(paragraphSourceId, paragraphTargetId) {
        const sourceIndex = this.paragraphs.findIndex(p => p.id === paragraphSourceId);
        const targetIndex = this.paragraphs.findIndex(p => p.id === paragraphTargetId);
        if (sourceIndex !== -1 && targetIndex !== -1) {
            [this.paragraphs[sourceIndex], this.paragraphs[targetIndex]] = [this.paragraphs[targetIndex], this.paragraphs[sourceIndex]];
        }
    }

    updateTitle(title){
        this.title = title;
    }

    observeParagraph(paragraphId){
        this.currentParagraphId = paragraphId;
    }
}