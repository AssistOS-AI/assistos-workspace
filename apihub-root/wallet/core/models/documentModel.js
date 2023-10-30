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
        this.settings = documentData.settings || null;
        this.currentChapterId = null;
        this.observers = [];
        this.mainIdeas = documentData.mainIdeas || [];
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

    async addChapters(chaptersData, ideas){
        for(let i= 0; i < chaptersData.length; i++){
            let chapterData= {
                title: chaptersData[i].title,
                id: webSkel.servicesRegistry.UtilsService.generateId(),
                paragraphs: [],
                mainIdeas: [ideas[i]]
            }
            let newChapter = new Chapter(chapterData);
            this.chapters.push(newChapter);
            newChapter.addParagraphs(chaptersData[i].paragraphs);
        }
        await documentFactory.updateDocument(currentSpaceId, this);
    }
    async addEmptyChapters(chaptersData, ideas){
        for(let i= 0; i < chaptersData.titles.length; i++){
            let chapterData= {
                title: chaptersData.titles[i],
                id: webSkel.servicesRegistry.UtilsService.generateId(),
                paragraphs: [],
                mainIdeas: [ideas[i]]
            }
            let newChapter = new Chapter(chapterData);
            this.chapters.push(newChapter);
        }
        await documentFactory.updateDocument(currentSpaceId, this);
    }
    setCurrentChapter(chapterId) {
        this.currentChapterId = chapterId;
    }

    getAlternativeAbstract(id){
        return this.alternativeAbstracts.find(abs=>abs.id === id);
    }

    async addAlternativeAbstract(abstractObj){
        this.alternativeAbstracts.push(abstractObj);
        await documentFactory.updateDocument(currentSpaceId, this);
    }

    deleteAlternativeAbstract(id){
        const index = this.alternativeAbstracts.findIndex(title => title.id === id);
        if (index !== -1) {
            this.alternativeAbstracts.splice(index, 1);
        }else {
            console.warn(`Failed to find alternative abstract with id: ${id}`);
        }
    }
   async updateAlternativeAbstract(id, newContent){
        let abstract = this.getAlternativeAbstract(id);
        if(abstract){
            abstract.content = newContent;
            await documentFactory.updateDocument(currentSpaceId, this);
        }else {
            console.warn(`Failed to find alternative abstract with id: ${id}`);
        }
    }

    async addAlternativeTitle(obj){
        this.alternativeTitles.push(obj);
        await documentFactory.updateDocument(currentSpaceId, this);
    }

    getMainIdeas() {
        return this.mainIdeas || [];
    }
    async setMainIdeas(ideas){
        this.mainIdeas = ideas;
        await documentFactory.updateDocument(currentSpaceId, this);
    }
    addMainIdea(mainIdea) {
        this.mainIdeas.push(mainIdea);
    }

    async updateAbstract(abstractText) {
        this.abstract = abstractText;
        await documentFactory.updateDocument(currentSpaceId, this);
    }

    /* left shift(decrement) the ids to the right of the deleted chapter? */
    async deleteChapter(chapterId) {
        const index = this.chapters.findIndex(chapter => chapter.id === chapterId);
        if (index !== -1) {
            this.chapters.splice(index, 1);
            await documentFactory.updateDocument(currentSpaceId, this);
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
        if (chapter1Index !== -1 && chapter2Index !== -1) {
            [this.chapters[chapter1Index], this.chapters[chapter2Index]] = [this.chapters[chapter2Index], this.chapters[chapter1Index]];
            return true;
        } else {
            console.warn("Attempting to swap chapters that no longer exist in this document.");
            return false;
        }
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

    async updateAlternativeTitle(id, newName) {
        let title = this.getAlternativeTitle(id);
        if(title){
            title.name = newName;
        }else {
            console.error(`Failed to find altTitle with id: ${id}`);
        }
        await documentFactory.updateDocument(currentSpaceId, this);
    }

    deleteAlternativeTitle(id) {
        const index = this.alternativeTitles.findIndex(title => title.id === id);
        if (index !== -1) {
            this.alternativeTitles.splice(index, 1);
        }else {
            console.error(`Failed to find altTitle with id: ${id}`);
        }
    }

    async setChapterMainIdeas(chapter, ideas){
        chapter.setMainIdeas(ideas);
        await documentFactory.updateDocument(currentSpaceId, this);
    }

    async addParagraph(chapter, paragraphData){
        chapter.addParagraph(paragraphData);
        await documentFactory.updateDocument(currentSpaceId, this);
    }

    async addParagraphs(chapter, paragraphsData, ideas){
        let data = []
        for(let i = 0 ; i < paragraphsData.length; i++){
            data.push({
               text: paragraphsData[i],
                mainIdea: ideas[i]
            });
        }
        chapter.addParagraphs(data);
        await documentFactory.updateDocument(currentSpaceId, this);
    }

    async deleteParagraph(chapter, id){
        chapter.deleteParagraph(id);
        await documentFactory.updateDocument(currentSpaceId, this);
    }

    async setParagraphMainIdea(paragraph, text){
        paragraph.setMainIdea(text);
        await documentFactory.updateDocument(currentSpaceId, this);
    }

    async updateParagraph(paragraph, alternativeParagraph){
        paragraph.updateText(alternativeParagraph.text);
        paragraph.setMainIdea(alternativeParagraph.mainIdea);
        await documentFactory.updateDocument(currentSpaceId, this);
    }

    async addAlternativeParagraph(paragraph, altParagraphData){
        paragraph.addAlternativeParagraph(altParagraphData);
        await documentFactory.updateDocument(currentSpaceId, this);
    }

    async updateAlternativeParagraph(paragraph, altParagraphId, text){
        paragraph.updateAlternativeParagraph(altParagraphId, text);
        await documentFactory.updateDocument(currentSpaceId, this);
    }

    async deleteAlternativeParagraph(paragraph, altParagraphId){
        paragraph.deleteAlternativeParagraph(altParagraphId);
        await documentFactory.updateDocument(currentSpaceId, this);
    }
    async deleteAlternativeChapter(chapter,alternativeChapterId){
        chapter.deleteAlternativeChapter(alternativeChapterId);
        await documentFactory.updateDocument(currentSpaceId,this);
    }

    async selectAlternativeChapter(currentChapter, alternativeChapterId) {
        let currentChapterIndex = this.getChapterIndex(currentChapter.id);
        let alternativeChapterIndex = currentChapter.getAlternativeChapterIndex(alternativeChapterId);

        let backupAlternativeChapters = [...this.chapters[currentChapterIndex].alternativeChapters];
        this.chapters[currentChapterIndex] = backupAlternativeChapters[alternativeChapterIndex];

        backupAlternativeChapters.splice(alternativeChapterIndex, 1);
        delete currentChapter.alternativeChapters;
        backupAlternativeChapters.push(currentChapter);

        this.chapters[currentChapterIndex].alternativeChapters = backupAlternativeChapters;

        await documentFactory.updateDocument(currentSpaceId, this);
    }

    getNotificationId() {
        return "doc";
    }

}