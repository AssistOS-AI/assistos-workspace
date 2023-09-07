import {Paragraph} from "../models/paragraph";
export class chapterService{
    constructor(){}
    createParagraph(chapter,paragraphText){
        chapter.paragraphs.push(new Paragraph(paragraphText, chapter.paragraphs.length + 1));
    }

    getParagraph(chapter,paragraphId) {
        const paragraph = chapter.paragraphs.find(paragraph => paragraph.id === paragraphId);
        return paragraph || null;
    }

    deleteParagraph(chapter,paragraphId) {
        const index = chapter.paragraphs.findIndex(paragraph => paragraph.id === paragraphId);
        if (index !== -1) {
            chapter.paragraphs.splice(index, 1);
        }
    }

    changeParagraphOrder(chapter,paragraphSourceId, paragraphTargetId) {
        const sourceIndex = chapter.paragraphs.findIndex(p => p.id === paragraphSourceId);
        const targetIndex = chapter.paragraphs.findIndex(p => p.id === paragraphTargetId);
        if (sourceIndex !== -1 && targetIndex !== -1) {
            [chapter.paragraphs[sourceIndex], chapter.paragraphs[targetIndex]] = [chapter.paragraphs[targetIndex], chapter.paragraphs[sourceIndex]];
        }
    }

    updateTitle(chapter,title){
        chapter.title = title;
    }

    observeParagraph(chapter,paragraphId){
        chapter.currentParagraphId = paragraphId;
    }
}