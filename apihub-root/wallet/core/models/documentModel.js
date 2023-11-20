import {Chapter, Paragraph} from "../../imports.js"

export class DocumentModel {
    constructor(documentData) {
        this.id = documentData.id || webSkel.getService("UtilsService").generateId();
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
    simplifyDocument(){
        return {
            title: this.title,
            abstract: this.abstract,
            chapters: this.chapters.map(chapter => chapter.simplifyChapter()),
            mainIdeas: this.mainIdeas
        }
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

    async addChapter(chapterData, position=0) {
        //if position is not specified splice converts undefined to 0
        this.chapters.splice(position,0,new Chapter(chapterData));
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    async addChapters(chaptersData){
        for(let i= 0; i < chaptersData.length; i++){
            let chapterData= {
                title: chaptersData[i].title,
                paragraphs: [],
                mainIdeas: chaptersData[i].mainIdeas
            }
            let newChapter = new Chapter(chapterData);
            this.chapters.push(newChapter);
            newChapter.addParagraphs(chaptersData[i].paragraphs);
        }
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }
    async addEmptyChapters(chaptersData){
        for(let i= 0; i < chaptersData.titles.length; i++){
            let chapterData= {
                title: chaptersData.titles[i],
                paragraphs: [],
                mainIdeas: []
            }
            let newChapter = new Chapter(chapterData);
            this.chapters.push(newChapter);
        }
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }
    setCurrentChapter(chapterId) {
        this.currentChapterId = chapterId;
    }

    getAlternativeAbstract(id){
        return this.alternativeAbstracts.find(abs=>abs.id === id);
    }

    async addAlternativeAbstract(abstractObj){
        this.alternativeAbstracts.push(abstractObj);
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
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
            await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
        }else {
            console.warn(`Failed to find alternative abstract with id: ${id}`);
        }
    }

    async addAlternativeTitle(obj){
        this.alternativeTitles.push(obj);
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    getMainIdeas() {
        return this.mainIdeas || [];
    }
    async setMainIdeas(ideas){
        this.mainIdeas = ideas;
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }
    addMainIdea(mainIdea) {
        this.mainIdeas.push(mainIdea);
    }

    async updateAbstract(abstractText) {
        this.abstract = abstractText;
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    /* left shift(decrement) the ids to the right of the deleted chapter? */
    async deleteChapter(chapterId) {
        const index = this.chapters.findIndex(chapter => chapter.id === chapterId);
        if (index !== -1) {
            this.chapters.splice(index, 1);
            await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
        }
    }

    getChapter(chapterId) {
        return this.chapters.find(chapter => chapter.id === chapterId);
    }

    getChapterIndex(chapterId) {
        return this.chapters.findIndex(chapter => chapter.id === chapterId);
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

    getAlternativeTitle(id){
        return this.alternativeTitles.find(title => title.id === id);
    }

    async updateTitle(title) {
        this.title = title;
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    async updateAlternativeTitle(id, newName) {
        let title = this.getAlternativeTitle(id);
        if(title){
            title.name = newName;
        }else {
            console.error(`Failed to find altTitle with id: ${id}`);
        }
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
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
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    async updateChapterAlternativeTitle(chapter, altTileId, title){
        chapter.updateAlternativeTitle(altTileId, title);
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    async addParagraph(chapter, paragraphData, position){
        chapter.addParagraph(paragraphData, position);
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    async deleteParagraph(chapter, id){
        chapter.deleteParagraph(id);
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    async setParagraphMainIdea(paragraph, text){
        paragraph.setMainIdea(text);
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    async updateParagraph(paragraph, alternativeParagraph){
        paragraph.updateText(alternativeParagraph.text);
        paragraph.setMainIdea(alternativeParagraph.mainIdea);
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    async updateParagraphText(paragraph, text){
        paragraph.updateText(text);
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }
    async addAlternativeParagraph(paragraph, altParagraphData){
        paragraph.addAlternativeParagraph(altParagraphData);
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    async updateAlternativeParagraph(paragraph, altParagraphId, text){
        paragraph.updateAlternativeParagraph(altParagraphId, text);
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    async deleteAlternativeParagraph(paragraph, altParagraphId){
        paragraph.deleteAlternativeParagraph(altParagraphId);
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }
    async deleteAlternativeChapter(chapter,alternativeChapterId){
        chapter.deleteAlternativeChapter(alternativeChapterId);
        await documentFactory.updateDocument(webSkel.currentUser.space.id,this);
    }

    getAlternativeTitleIndex(alternativeTitleId) {
        return this.alternativeTitles.findIndex(title => title.id === alternativeTitleId);
    }
    getAlternativeAbstractIndex(alternativeAbstractId) {
        return this.alternativeAbstracts.findIndex(abstract => abstract.id === alternativeAbstractId);
    }
    async selectAlternativeTitle(alternativeTitleId) {
        let alternativeTitleIndex=this.getAlternativeTitleIndex(alternativeTitleId);
        if(alternativeTitleIndex!==-1) {
            let currentTitle = this.title;
            this.title = this.alternativeTitles[alternativeTitleIndex].name;
            this.alternativeTitles.splice(alternativeTitleIndex, 1);
            this.alternativeTitles.splice(alternativeTitleIndex,0,{id: webSkel.servicesRegistry.UtilsService.generateId(), name: currentTitle});
            await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
        }else{
            console.warn("Attempting to select alternative title that doesn't exist in this document.");
        }
    }
    async selectAlternativeAbstract(alternativeAbstractId) {
        let alternativeAbstractIndex=this.getAlternativeAbstractIndex(alternativeAbstractId);
        if(alternativeAbstractIndex!==-1) {
            let currentAbstract = this.abstract;
            this.abstract = this.alternativeAbstracts[alternativeAbstractIndex].content;
            this.alternativeAbstracts.splice(alternativeAbstractIndex, 1);
            this.alternativeAbstracts.splice(alternativeAbstractIndex,0,{id: webSkel.servicesRegistry.UtilsService.generateId(), content: currentAbstract});
            await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
        }else{
            console.warn("Attempting to select alternative abstract that doesn't exist in this document.");
        }
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

        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    async updateChapterTitle(chapter, newTitle){
        chapter.updateTitle(newTitle);
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    getNotificationId() {
        return "doc";
    }

}