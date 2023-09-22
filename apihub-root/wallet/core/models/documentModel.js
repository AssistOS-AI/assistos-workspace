import { Chapter } from "./chapter.js";

export class DocumentModel {
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
        this.observers = [];
    }

    toString() {
        return this.chapters.map(chapter => chapter.toString()).join("\n\n") || "";
    }

    observeChange(elementId, callback) {
        let obj = {elementId: elementId, callback: callback};
        this.observers.push(new WeakRef(obj));
    }

    //doc:childId:paragraphId
    //a child can be not only a chapter, but also a title or abstract or mainIdea
    notifyObservers(prefix) {
        for (const observerRef of this.observers) {
            const observer = observerRef.deref();
            if(observer && observer.elementId.startsWith(prefix)) {
                observer.callback();
            }
        }
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

    getChapterParagraph(chapterId, paragraphId) {
        let chapterIndex = this.chapters.findIndex(chapter => chapter.id === chapterId);
        return this.chapters[chapterIndex].paragraphs.find(paragraph => paragraph.id === paragraphId);
    }

    getCurrentChapter() {
        return this.chapters.find(chapter => chapter.id === document.currentChapterId);
    }

    async swapChapters(chapterId1, chapterId2) {
        [this.chapters[chapterId1], this.chapters[chapterId2]] = [this.chapters[chapterId2], this.chapters[chapterId1]];
        await this.updateDocument();
    }

    async swapParagraphs(chapterIndex, paragraphIndex1, paragraphIndex2) {
        [this.chapters[chapterIndex].paragraphs[paragraphIndex1], this.chapters[chapterIndex].paragraphs[paragraphIndex2]] = [this.chapters[chapterIndex].paragraphs[paragraphIndex2], this.chapters[chapterIndex].paragraphs[paragraphIndex1]];
        await this.updateDocument();
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

    setTitle(title) {
        this.title = title;
    }

    setAlternativeTitle(index, alternativeTitle) {
        this.alternativeTitles[index] = alternativeTitle;
    }

    deleteAlternativeTitle(index) {
        this.alternativeTitles.splice(index, 1);
    }

    static getDocument(documentId) {
        const document = webSkel.space.documents.find(document => document.id === documentId);
        return document || null;
    }

    getNotifyId() {
        return "doc";
    }

    getDocumentIndex() {
        return webSkel.space.documents.findIndex(document => document.id === this.id);
    }

    async deleteDocument() {
        await webSkel.localStorage.deleteDocument(webSkel.space.id, this.id);
        webSkel.space.currentDocumentId = null;
    }

    async updateDocument() {
        let observers = this.observers;
        this.observers = undefined;
        await webSkel.localStorage.updateDocument(webSkel.space.id, this.id, this);
        this.observers = observers;
    }

    static async addDocument(document) {
        let observers = document.observers;
        document.observers = undefined;
        await webSkel.localStorage.addDocument(document, webSkel.space.id);
        document.observers = observers;
        webSkel.space.documents.push(document);
    }
}