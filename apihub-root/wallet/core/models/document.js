import { Chapter } from "../../imports.js";

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
        this.currentChapterId = chapterId;
    }

    setCurrentChapter(chapterId) {
        this.currentChapterId = chapterId;
    }

    updateDocumentTitle(documentTitle) {
        this.title = documentTitle;
    }

    updateAbstract(abstractText){
        this.abstract = abstractText;
    }

    /* left shift(decrement) the ids to the right of the deleted chapter? */
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

    getCurrentChapter() {
        return this.chapters.find(chapter => chapter.id === this.currentChapterId);
    }

    swapChapters(chapterId1, chapterId2) {
        [this.chapters[chapterId1], this.chapters[chapterId2]] = [this.chapters[chapterId2], this.chapters[chapterId1]];
    }
}