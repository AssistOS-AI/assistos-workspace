import {Chapter, Paragraph} from "../../imports.js"

export class DocumentModel {
    constructor(documentData) {
        this.id = documentData.id || webSkel.appServices.generateId();
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
            topic: this.topic,
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

    getAlternativeAbstract(id){
        return this.alternativeAbstracts.find(abs=>abs.id === id);
    }

    async addAlternativeAbstract(abstractObj){
        this.alternativeAbstracts.push(abstractObj);
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }

    async deleteAlternativeAbstract(id){
        const index = this.alternativeAbstracts.findIndex(title => title.id === id);
        if (index !== -1) {
            this.alternativeAbstracts.splice(index, 1);
        }else {
            console.warn(`Failed to find alternative abstract with id: ${id}`);
        }
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }
    async deleteAlternativeTitle(altTitleId) {
        const index = this.alternativeTitles.findIndex(altTitle => altTitle.id === altTitleId);
        if (index !== -1) {
            this.alternativeTitles.splice(index, 1);
        }
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
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
    async updateAlternativeTitle(id,text){
        let alternativeTitle= this.getAlternativeTitle(id)
        alternativeTitle.title=text;
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
    }
    async addAlternativeTitles(alternativeTitles){
        for(let title of alternativeTitles){
            title.id=webSkel.appServices.generateId();
        }
        this.alternativeTitles.push(...alternativeTitles);
    }

    getMainIdeas() {
        return this.mainIdeas;
    }
    async setMainIdeas(ideas){
        this.mainIdeas = ideas;
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
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
    getAlternativeAbstractIndex(alternativeAbstractId) {
        return this.alternativeAbstracts.findIndex(abstract => abstract.id === alternativeAbstractId);
    }
    async selectAlternativeTitle(alternativeTitleId) {
        let alternativeTitleIndex=this.alternativeTitles.findIndex(title => title.id === alternativeTitleId);
        if(alternativeTitleIndex!==-1) {
            let currentTitle = this.title;
            this.title = this.alternativeTitles[alternativeTitleIndex].title;
            this.alternativeTitles.splice(alternativeTitleIndex, 1);
            this.alternativeTitles.splice(alternativeTitleIndex,0,{id: webSkel.appServices.generateId(), title: currentTitle});
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
            this.alternativeAbstracts.splice(alternativeAbstractIndex,0,{id: webSkel.appServices.generateId(), content: currentAbstract});
            await documentFactory.updateDocument(webSkel.currentUser.space.id, this);
        }else{
            console.warn("Attempting to select alternative abstract that doesn't exist in this document.");
        }
    }

    getNotificationId() {
        return "doc";
    }
}