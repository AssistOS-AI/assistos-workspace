import { Chapter } from "../../imports.js";

export class Document {
    constructor(documentTitle, documentId, abstract, chapters, settings) {
        this.name = documentTitle;
        if(documentId) {
            this.id = documentId;
        }
        this.abstract = abstract ? abstract : "";
        this.chapters = chapters ? chapters : [];
        this.chapters = (chapters || []).map(chapter => new Chapter(chapter.title, chapter.id, chapter.paragraphs));
        this.settings = settings ? settings : {};
        this.currentChapter = null;
    }

    createChapter(title) {
        this.chapters.push(new Chapter(title, this.chapters.length + 1, []));
    }

    changeChapterOrder(chapterSourceId, chapterTargetId) {
        const sourceIndex = this.chapters.findIndex(ch => ch.id === chapterSourceId);
        const targetIndex = this.chapters.findIndex(ch => ch.id === chapterTargetId);
        if (sourceIndex !== -1 && targetIndex !== -1) {
            [this.chapters[sourceIndex], this.chapters[targetIndex]] = [this.chapters[targetIndex], this.chapters[sourceIndex]];
        }
    }

    observeChapter(chapterId) {
        this.currentChapter = chapterId;
    }

    updateDocumentTitle(documentTitle) {
        this.name = documentTitle;
    }

    updateAbstract(abstractText){
        this.abstract = abstractText;
    }

    deleteChapter(chapterId) {
        const index = this.chapters.findIndex(chapter => chapter.id === chapterId);
        if (index !== -1) {
            this.chapters.splice(index, 1);
        }
    }

    getChapter(chapterId) {
        const chapter = this.chapters.find(chapter => chapter.id === chapterId);
        return chapter || null;
    }

    setCurrentChapter(chapterId) {
        this.currentChapter = chapterId;
    }

    getCurrentChapter() {
        return this.chapters.find(chapter => chapter.id === this.currentChapter);
    }

    swapChapters(chapterId1, chapterId2) {
        let chapter1 = this.chapters.find(chapter => chapter.id === chapterId1);
        let chapter2 = this.chapters.find(chapter => chapter.id === chapterId2);
        let index1 = this.chapters.indexOf(chapter1);
        let index2 = this.chapters.indexOf(chapter2);
        this.chapters[index1] = chapter2;
        this.chapters[index2] = chapter1;
    }
}