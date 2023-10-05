import { Chapter } from "./chapter.js";

export class DocumentModel {
    constructor(documentData) {
        this.id = documentData.id || undefined;
        this.title = documentData.title || "";
        this.abstract = documentData.abstract || "";
        this.topic = documentData.topic||"";
        this.chapters = (documentData.chapters || []).map(chapterData => new Chapter(chapterData));
        this.alternativeTitles = documentData.alternativeTitles || [];
        this.alternativeAbstracts = documentData.alternativeAbstracts || [];
        this.settings = documentData.settings || {llm: null, personality: null, documentTitleScript: {name:"default", id:"default", content:""}};
        this.currentChapterId = null;
        this.observers = [];
    }

    toString() {
        return this.chapters.map(chapter => chapter.toString()).join("\n\n") || "";
    }

    stringifyDocument() {
        function replacer(key, value) {
            if (key === "observers") return undefined;
            else if (key === "currentChapterId") return undefined;
            else if (key === "currentParagraphId") return undefined;
            else return value;
        }
        return JSON.stringify(this, replacer);
    }

    observeChange(elementId, callback) {
        let obj = {elementId: elementId, callback: callback};
        callback.refferenceObject = obj;
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

    async addChapter(chapterData) {
        this.chapters.push(new Chapter(chapterData));
        await documentFactory.updateDocument(currentSpaceId, this);
    }

    setCurrentChapter(chapterId) {
        this.currentChapterId = chapterId;
    }

    async updateDocumentTitle(documentTitle) {
        this.title = documentTitle;
        await documentFactory.updateDocument(currentSpaceId, this);

    }

    addAlternativeAbstract(abstractText){
        this.alternativeAbstracts.push(abstractText);
    }

    addAlternativeTitle(title){
        this.alternativeTitles.push(title);
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

    async updateAbstract(abstractText) {
        this.abstract = abstractText;
        await documentFactory.updateDocument(currentSpaceId, this);
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

    removeParagraph(chapterId, paragraphId) {
        let chapter = this.chapters.find(chapter => chapter.id === chapterId);
        let paragraphIndex = chapter.paragraphs.findIndex(paragraph => paragraph.id === paragraphId);
        chapter.paragraphs.splice(paragraphIndex, 1);
    }

    removeChapter(chapterId) {
        let chapterIndex = this.chapters.findIndex(chapter => chapter.id === chapterId);
        this.chapters.splice(chapterIndex, 1);
    }

    getChapterParagraphs(chapterId) {
        return this.chapters.find(chapter => chapter.id ===chapterId).paragraphs;
    }

    getParagraph(chapterId, paragraphId) {
        let chapter = this.chapters.find(chapter => chapter.id === chapterId);
        return chapter.paragraphs.find(paragraph => paragraph.id === paragraphId);
    }

    getCurrentChapter() {
        return this.chapters.find(chapter => chapter.id === document.currentChapterId);
    }

    async swapChapters(chapterId1, chapterId2) {
        [this.chapters[chapterId1], this.chapters[chapterId2]] = [this.chapters[chapterId2], this.chapters[chapterId1]];
    }

    async swapParagraphs(chapterIndex, paragraphIndex1, paragraphIndex2) {
        [this.chapters[chapterIndex].paragraphs[paragraphIndex1], this.chapters[chapterIndex].paragraphs[paragraphIndex2]] = [this.chapters[chapterIndex].paragraphs[paragraphIndex2], this.chapters[chapterIndex].paragraphs[paragraphIndex1]];
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

    getNotificationId() {
        return "doc";
    }

    getDocumentIndex() {
        return webSkel.space.documents.findIndex(document => document.id === this.id);
    }

}