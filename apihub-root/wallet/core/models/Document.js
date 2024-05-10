import {Chapter} from "../../imports.js"

const documentModule = require("assistos").loadModule("document");
export class Document {
    constructor(documentData) {
        this.id = documentData.id;
        this.title = documentData.title || "";
        this.abstract = documentData.abstract || "";
        this.topic = documentData.topic||"";
        this.chapters = (documentData.chapters || []).map(chapterData => new Chapter(chapterData));
        this.alternativeTitles = documentData.alternativeTitles || [];
        this.alternativeAbstracts = documentData.alternativeAbstracts || [];
        this.currentChapterId = null;
        this.observers = [];
        this.mainIdeas = documentData.mainIdeas || [];
        this.metadata = ["id", "title"];
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
        await assistOS.storage.updateDocument(assistOS.space.id, this);
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
        await assistOS.storage.updateDocument(assistOS.space.id, this);
    }

    getAlternativeAbstract(id){
        return this.alternativeAbstracts.find(abs=>abs.id === id);
    }

    async addAlternativeAbstract(abstractObj){
        this.alternativeAbstracts.push(abstractObj);
        await assistOS.storage.addAlternativeAbstract(assistOS.space.id, this.id, abstractObj);
    }

    async deleteAlternativeAbstract(id){
        const index = this.alternativeAbstracts.findIndex(title => title.id === id);
        if (index !== -1) {
            this.alternativeAbstracts.splice(index, 1);
        }else {
            console.warn(`Failed to find alternative abstract with id: ${id}`);
        }
        await assistOS.space.updateDocument(assistOS.space.id, this);
    }
    async deleteAlternativeTitle(altTitleId) {
        const index = this.alternativeTitles.findIndex(altTitle => altTitle.id === altTitleId);
        if (index !== -1) {
            this.alternativeTitles.splice(index, 1);
        }
        await assistOS.space.updateDocument(assistOS.space.id, this);
    }
    async updateAlternativeAbstract(id, newContent){
        let abstract = this.getAlternativeAbstract(id);
        if(abstract){
            abstract.content = newContent;
            await assistOS.space.updateDocument(assistOS.space.id, this);
        }else {
            console.warn(`Failed to find alternative abstract with id: ${id}`);
        }
    }
    async updateAlternativeTitle(id,text){
        let alternativeTitle= this.getAlternativeTitle(id)
        alternativeTitle.title=text;
        await assistOS.space.updateDocument(assistOS.space.id, this);
    }
    async addAlternativeTitles(alternativeTitles){
        for(let title of alternativeTitles){
            title.id=assistOS.services.generateId();
        }
        this.alternativeTitles.push(...alternativeTitles);
    }

    async setMainIdeas(ideas){
        this.mainIdeas = ideas;
        await assistOS.space.updateDocument(assistOS.space.id, this);
    }

    async updateAbstract(abstractText) {
        this.abstract = abstractText;
        await assistOS.storage.updateDocumentAbstract(assistOS.space.id, this.id, abstractText);
    }

    getChapter(chapterId) {
        return this.chapters.find(chapter => chapter.id === chapterId);
    }
    async refreshDocumentTitle() {
        this.title = await documentModule.getDocumentTitle(assistOS.space.id, this.id);
    }
    async refreshDocumentAbstract() {
        this.abstract = await documentModule.getDocumentAbstract(assistOS.space.id, this.id);
    }
    async refreshChapter(documentId ,chapterId){
        let chapterData = await documentModule.getChapter(assistOS.space.id, documentId, chapterId);
        let chapterIndex = this.getChapterIndex(chapterId);
        let chapter = new Chapter(chapterData)
        this.chapters[chapterIndex] = chapter;
        return chapter;
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
        await assistOS.storage.updateDocumentTitle(assistOS.space.id, this.id, title);
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
            this.alternativeTitles.splice(alternativeTitleIndex,0,{id: assistOS.services.generateId(), title: currentTitle});
            await assistOS.space.updateDocument(assistOS.space.id, this);
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
            this.alternativeAbstracts.splice(alternativeAbstractIndex,0,{id: assistOS.services.generateId(), content: currentAbstract});
            await assistOS.space.updateDocument(assistOS.space.id, this);
        }else{
            console.warn("Attempting to select alternative abstract that doesn't exist in this document.");
        }
    }

    getNotificationId() {
        return "doc";
    }
}