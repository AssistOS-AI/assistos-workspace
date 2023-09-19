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
    toString() {
        return `${this.title}\n${this.paragraphs.map(paragraph => paragraph.toString()).join("\n")}`;
    }
}