import { Paragraph } from './paragraph.js';

export class Chapter {
    constructor(title, chapterId, paragraphs) {
        this.title = title;
        this.id = chapterId;
        this.visibility = "show";
        this.paragraphs = [];
        if(paragraphs && paragraphs.length > 0) {
            for(let i = 0; i < paragraphs.length; i++) {
                if(paragraphs[i] !== undefined) {
                    this.paragraphs.push(new Paragraph(paragraphs[i].text, paragraphs[i].id));
                }
            }
        }
        this.currentParagraphId = paragraphs[0] ? paragraphs[0].id : undefined;
    }
    toString() {
        return `${this.title}\n${this.paragraphs.map(paragraph => paragraph.toString()).join("\n")}`;
    }
}