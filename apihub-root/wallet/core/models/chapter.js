import { Paragraph } from '../../imports.js';
export class Chapter {
    constructor(title, chapterId, paragraphs) {
        this.title = title;
        this.id = chapterId;
        this.visibility = "show";
        this.paragraphs = (paragraphs || []).map(paragraph => new Paragraph(paragraph.text, paragraph.id));
        this.currentParagraphId = paragraphs[0] ? paragraphs[0].id : undefined;
    }
    toString() {
        return `${this.title}\n${this.paragraphs.map(paragraph => paragraph.toString()).join("\n")}`;
    }
}