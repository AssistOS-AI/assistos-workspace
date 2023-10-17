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
        this.settings = documentData.settings || {documentTitleScriptId: null, documentAbstractScriptId:null, proofreadScriptId:null};
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

    notifyObservers(prefix) {
        for (const observerRef of this.observers) {
            const observer = observerRef.deref();
            /* multiple refreshes at the same time( when refreshing a parent the child also refresh causing problems */
            /* doc:document-view-page:chapter:23SDFAasd4
              * doc:document-view-page
              * doc:document-view-page:right-sidebar:chapter-titles:chapter:23SDFAasd4
            */
            if(observer &&observer.elementId.startsWith(prefix)) {
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

    getAlternativeAbstract(id){
        return this.alternativeAbstracts.find(abs=>abs.id === id);
    }

    addAlternativeAbstract(abstractObj){
        this.alternativeAbstracts.push(abstractObj);
    }

    deleteAlternativeAbstract(id){
        const index = this.alternativeAbstracts.findIndex(title => title.id === id);
        if (index !== -1) {
            this.alternativeAbstracts.splice(index, 1);
        }else {
            console.error(`Failed to find alternative abstract with id: ${id}`);
        }
    }
    updateAlternativeAbstract(id, newContent){
        let abstract = this.getAlternativeAbstract(id);
        if(abstract){
            abstract.content = newContent;
        }else {
            console.error(`Failed to find alternative abstract with id: ${id}`);
        }
    }

    addAlternativeTitle(obj){
        this.alternativeTitles.push(obj);
    }

    getMainIdeas() {
        return this.mainIdeas || [];
    }

    addMainIdea(mainIdea) {
        this.mainIdeas.push(mainIdea);
    }

    updateAbstract(abstractText) {
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

    removeChapter(chapterId) {
        let chapterIndex = this.chapters.findIndex(chapter => chapter.id === chapterId);
        this.chapters.splice(chapterIndex, 1);
    }

    swapChapters(chapterId1, chapterId2) {
        let chapter1Index = this.chapters.findIndex(chapter => chapter.id === chapterId1);
        let chapter2Index = this.chapters.findIndex(chapter => chapter.id === chapterId2);
        [this.chapters[chapter1Index], this.chapters[chapter2Index]] = [this.chapters[chapter2Index], this.chapters[chapter1Index]];
    }

    getTitle() {
        return this.title || null;
    }

    getAlternativeTitle(id){
        return this.alternativeTitles.find(title => title.id === id);
    }

    setTitle(title) {
        this.title = title;
    }

    updateAlternativeTitle(id, newName) {
        let title = this.getAlternativeTitle(id);
        if(title){
            title.name = newName;
        }else {
            console.error(`Failed to find altTitle with id: ${id}`);
        }
    }

    deleteAlternativeTitle(id) {
        const index = this.alternativeTitles.findIndex(title => title.id === id);
        if (index !== -1) {
            this.alternativeTitles.splice(index, 1);
        }else {
            console.error(`Failed to find altTitle with id: ${id}`);
        }
    }

    getNotificationId() {
        return "doc";
    }
    getSettingsComponent(name){
        if(!this.settings[name]){
            return null;
        }

        return webSkel.space.getScript(this.settings[name]);

    }

    getScriptId(name){
        return this.settings[name];
    }
}