import { Chapter } from "./chapter.js";

export class Document {
    constructor(documentTitle, documentId, abstract, chapters, settings) {
        this.title = documentTitle;
        if(documentId) {
            this.id = documentId;
        }
        this.abstract = abstract ? abstract : "";
        this.chapters = [];
        if(chapters !== undefined && chapters !== null) {
            let i = 0;
            while(chapters[i] !== undefined && chapters[i] !== null) {
                this.chapters.push(new Chapter(chapters[i].title, chapters[i].id, chapters[i].paragraphs));
                i++;
            }
        }
        // this.chapters = (chapters || []).map(chapter => new Chapter(chapter.title, chapter.id, chapter.paragraphs));
        // this.currentChapterId = this.chapters?this.chapters[0].id:undefined;
        if(this.chapters && this.chapters.length > 0) {
            this.currentChapterId = this.chapters[0].id;
        } else {
            this.currentChapterId = undefined;
        }
        this.settings = settings ? settings : {};
    }
}