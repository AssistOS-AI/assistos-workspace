import { Chapter } from "./chapter.js";

export class DocumentModel {
    static observers = [];
    constructor(documentData) {
        this.title = documentData.title || "";
        this.abstract = documentData.abstract || "";
        this.chapters = (documentData.chapters || []).map(chapterData => new Chapter(chapterData));
        this.mainIdeas = documentData.mainIdeas || [];
        this.alternativeTitles = documentData.alternativeTitles || [];
        this.alternativeAbstracts = documentData.alternativeAbstracts || [];
        this.settings = documentData.settings || {llm: null, personality: null};
        this.currentChapterId = null;
        this.id = documentData.id || undefined;
    }

    toString() {
        return this.chapters.map(chapter => chapter.toString()).join("\n\n") || "";
    }

    observeChange(elementId) {
        DocumentModel.observers.push(new WeakRef(elementId));
    }

    notifyObservers() {
        for (const observerRef of this.observers) {
            const observer = observerRef.deref();
            if (observer) {
                observer();
            }
        }
    }

    saveDocument() {
        webSkel.storageService.saveDocument(this);
    }

    getDocSettings() {
        return this.settings || [];
    }

    setDocSettings(settings) {
        this.settings = settings;
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

    addAlternativeAbstract(abstractText){
        this.alternativeAbstracts.push(abstractText);
    }

    getMainIdeas() {
        return this.mainIdeas || [];
    }

    setMainIdeas(mainIdeas) {
        this.mainIdeas = mainIdeas;
    }

    addMainIdea(mainIdea) {
        this.mainIdeas.push(mainIdea);
    }

    updateAbstract(abstractText) {
        this.abstract = abstractText;
    }

    getAbstract() {
        return this.abstract || "";
    }

    /* left shift(decrement) the ids to the right of the deleted chapter? */
    deleteChapter(chapterId) {
        const index = this.chapters.findIndex(chapter => chapter.id === chapterId);
        if (index !== -1) {
            this.chapters.splice(index, 1);
        }
    }

    deleteParagraph(chapterId) {
        const index = this.chapters.findIndex(chapter => chapter.id === chapterId);
        if (index !== -1) {
            this.chapters.splice(index, 1);
        }
    }

    getChapter(chapterId) {
        return this.chapters.find(chapter => chapter.id === chapterId);
    }

    getChapterIndex(chapterId) {
        return this.chapters.findIndex(chapter => chapter.id === chapterId);
    }

    getChapterTitle(chapterId) {
        let chapter = this.chapters.find(chapter => chapter.id === chapterId);
        return chapter.title || null;
    }

    updateChapterTitle(chapterId, chapterTitle) {
        let chapter = this.chapters.find(chapter => chapter.id === chapterId);
        chapter.title = chapterTitle;
    }

    getParagraphIndex(chapterIndex, paragraphId) {
        return this.chapters[chapterIndex].paragraphs.findIndex(paragraph => paragraph.id === paragraphId);
    }

    removeParagraph(chapterId, paragraphId) {
        let chapter = this.chapters.find(chapter => chapter.id === chapterId);
        let paragraphIndex = chapter.paragraphs.findIndex(paragraph => paragraph.id === paragraphId);
        chapter.paragraphs.splice(paragraphIndex, 1);
    }

    removeChapter(chapterId) {
        let chapterIndex = this.chapters.findIndex(chapter => chapter.id === chapterId);
        this.chapters.splice(chapterIndex, 1);
    }

    getChapterParagraphs(chapterIndex) {
        return this.chapters[chapterIndex].paragraphs;
    }

    getChapterParagraph(chapterIndex, paragraphId) {
        return this.chapters[chapterIndex].paragraphs.find(paragraph => paragraph.id === paragraphId);
    }

    getCurrentChapter() {
        return this.chapters.find(chapter => chapter.id === document.currentChapterId);
    }

    async swapChapters(chapterId1, chapterId2) {
        [this.chapters[chapterId1], this.chapters[chapterId2]] = [this.chapters[chapterId2], this.chapters[chapterId1]];
        await webSkel.localStorage.updateDocument(webSkel.space.id, this.id, this);
    }

    async swapParagraphs(chapterIndex, paragraphIndex1, paragraphIndex2) {
        [this.chapters[chapterIndex].paragraphs[paragraphIndex1], this.chapters[chapterIndex].paragraphs[paragraphIndex2]] = [this.chapters[chapterIndex].paragraphs[paragraphIndex2], this.chapters[chapterIndex].paragraphs[paragraphIndex1]];
        await webSkel.localStorage.updateDocument(webSkel.space.id, this.id, this);
    }

    updateParagraphText(chapterId, paragraphId, paragraphText) {
        let chapter = this.chapters.find(chapter => chapter.id === chapterId);
        let paragraph = chapter.paragraphs.find(paragraph => paragraph.id === paragraphId);
        paragraph.text = paragraphText;
    }

    getSettings() {
        return this.settings || {llm: null, personality: null};
    }

    getTitle() {
        return this.title || null;
    }

    getAlternativeAbstracts() {
        return this.alternativeAbstracts || [];
    }

    getAllChapters() {
        return this.chapters || [];
    }

    getAlternativeTitles() {
        return this.alternativeTitles || [];
    }

    updateTitle(title) {
        this.title = title;
    }

    setAlternativeTitle(index, alternativeTitle) {
        this.alternativeTitles[index] = alternativeTitle;
    }

    deleteAlternativeTitle(index) {
        this.alternativeTitles.splice(index, 1);
    }
}