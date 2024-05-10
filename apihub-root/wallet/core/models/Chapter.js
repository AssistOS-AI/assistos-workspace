import {Paragraph} from "../../imports.js";

const documentModule = require("assistos").loadModule("document");
export class Chapter {
    constructor(chapterData) {
        this.position = chapterData.position;
        this.title = chapterData.title;
        this.id = chapterData.id || assistOS.services.generateId();
        this.visibility = "show";
        this.paragraphs = [];
        this.alternativeChapters=[]
        this.alternativeTitles = chapterData.alternativeTitles || [];
        if(chapterData.alternativeChapters && chapterData.alternativeChapters.length>0) {
            this.alternativeChapters = chapterData.alternativeChapters.map((alternativeChapterData) =>
                new Chapter(alternativeChapterData)
            );

        }
            if(chapterData.paragraphs && chapterData.paragraphs.length > 0) {
            for(let i = 0; i < chapterData.paragraphs.length; i++) {
                if(chapterData.paragraphs[i] !== undefined) {
                    this.paragraphs.push(new Paragraph(chapterData.paragraphs[i]));
                }
            }
        }
        this.currentParagraphId = null;
        this.mainIdeas = chapterData.mainIdeas || [];
    }
    simplifyChapter() {
        return {
            title: this.title,
            paragraphs: this.paragraphs.map((paragraph) => paragraph.simplifyParagraph()),
            mainIdeas: this.mainIdeas
        }
    }
    getNotificationId() {
        return `doc:${this.id}`;
    }

    stringifyChapter() {
        function replacer(key, value) {
            if (key === "visibility") return undefined;
            else if (key === "currentParagraphId") return undefined;
            else if (key === "mainIdeas") return undefined;
            else if (key === "id") return undefined;
            else return value;
        }
        return JSON.stringify(this, replacer);
    }
    async refreshChapterTitle(documentId, chapterId) {
        this.title = await documentModule.getChapterTitle(assistOS.space.id, documentId, chapterId);
    }
    async refreshParagraph(documentId, paragraphId) {
        let paragraphData = await documentModule.getParagraph(assistOS.space.id, documentId, paragraphId);
        let paragraphIndex = this.paragraphs.findIndex(paragraph => paragraph.id === paragraphId);
        this.paragraphs[paragraphIndex] = new Paragraph(paragraphData);
        return this;
    }
    addParagraph(paragraphData){
        //if position is not specified splice converts undefined to 0
        this.paragraphs.splice(paragraphData.position,0,new Paragraph(paragraphData));
    }

    addParagraphs(paragraphsData){
        for(let paragraph of paragraphsData){
            let paragraphData = {
                text: paragraph.text,
                mainIdea : paragraph.mainIdea
            }
            this.paragraphs.push(new Paragraph(paragraphData));
        }
    }
    deleteParagraph(paragraphId) {
        let paragraphIndex = this.paragraphs.findIndex(paragraph => paragraph.id === paragraphId);
        if(paragraphIndex !== -1) {
            this.paragraphs.splice(paragraphIndex, 1);
        }else{
            console.error("Attempting to delete paragraph that no longer exists in this chapter.");
        }
    }
    updateTitle(newTitle) {
        this.title = newTitle;
    }
    addAlternativeTitles(alternativeTitles) {
        for(let title of alternativeTitles){
            title.id=assistOS.services.generateId();
        }
        this.alternativeTitles.push(...alternativeTitles);
    }
    deleteAlternativeTitle(alternativeTitleId) {
        let index = this.alternativeTitles.findIndex(alternativeTitle => alternativeTitle.id === alternativeTitleId);
        if(index !== -1) {
            this.alternativeTitles.splice(index, 1);
            return true;
        }else{
            console.warn("Attempting to delete alternative title that doesn't exist in this chapter.");
            return false;
        }
    }
    updateAlternativeTitle(alternativeTitleId, newTitle) {
        let index = this.alternativeTitles.findIndex(alternativeTitle => alternativeTitle.id === alternativeTitleId);
        if(index !== -1) {
            this.alternativeTitles[index].title = newTitle;
            return true;
        }else{
            console.warn("Attempting to update alternative title that doesn't exist in this chapter.");
            return false;
        }
    }
    getAlternativeTitle(alternativeTitleId) {
        return this.alternativeTitles.find(alternativeTitle => alternativeTitle.id === alternativeTitleId)||null;
    }
    getAlternativeTitleIndex(alternativeTitleId) {
        return this.alternativeTitles.findIndex(alternativeTitle => alternativeTitle.id === alternativeTitleId);
    }
    selectAlternativeTitle(alternativeTitleId) {
        let alternativeTitleIndex= this.getAlternativeTitleIndex(alternativeTitleId);
        if(alternativeTitleIndex !== -1) {
            let currentTitle = {title:this.title,id:assistOS.services.generateId()};
            this.title = this.alternativeTitles[alternativeTitleIndex].title;
            this.alternativeTitles[alternativeTitleIndex] = currentTitle;
        }else{
            console.warn("Attempting to select alternative title that doesn't exist in this chapter.");
        }
    }
    getParagraph(paragraphId) {
        return this.paragraphs.find(paragraph => paragraph.id === paragraphId)||null;
    }
    getParagraphIndex(paragraphId) {
        return this.paragraphs.findIndex(paragraph => paragraph.id === paragraphId);
    }
    swapParagraphs(paragraphId1, paragraphId2) {
        let index1 = this.paragraphs.findIndex(paragraph => paragraph.id === paragraphId1);
        let index2 = this.paragraphs.findIndex(paragraph => paragraph.id === paragraphId2);
        if(index1 !== -1 && index2 !== -1) {
            [this.paragraphs[index1], this.paragraphs[index2]] = [this.paragraphs[index2], this.paragraphs[index1]];
            return true;
        }else{
            console.error("Attempting to swap paragraphs that no longer exist in this chapter.");
            return false;
        }
    }
    getAlternativeChapterIndex(alternativeChapterId) {
        return this.alternativeChapters.findIndex(alternativeChapter => alternativeChapter.id === alternativeChapterId);
    }
    getAlternativeChapter(alternativeChapterId){
        return this.alternativeChapters.find(alternativeChapter => alternativeChapter.id === alternativeChapterId) || `Cannot find alternative chapter with id:${alternativeChapterId}`;
    }
    async addAlternativeChapter(chapterData){
        let chapterObj=new Chapter(chapterData);
        this.alternativeChapters.push(chapterObj);
    }
    deleteAlternativeChapter(alternativeChapterId) {
        let index = this.getAlternativeChapterIndex(alternativeChapterId);
        if(index !== -1) {
            this.alternativeChapters.splice(index, 1);
            return true;
        }else{
            console.error("Attempting to delete alternative chapter that doesn't exist in this chapter.");
            return false;
        }
    }

    async selectAlternativeChapter(alternativeChapterId) {
        let alternativeChapter = this.getAlternativeChapter(alternativeChapterId);
        let clone = Object.assign({}, this);
        this.title = alternativeChapter.title;
        this.id = alternativeChapter.id;
        this.mainIdeas = Array.from(alternativeChapter.mainIdeas);
        this.paragraphs = Array.from(alternativeChapter.paragraphs);

        let alternativeChapterIndex = this.getAlternativeChapterIndex(alternativeChapterId);
        this.alternativeChapters.splice(alternativeChapterIndex, 1);
        this.alternativeChapters.splice(alternativeChapterIndex,0,{
            id: clone.id,
            paragraphs: clone.paragraphs,
            mainIdeas: clone.mainIdeas,
            title: clone.title
        });
    }
    getMainIdeas(){
        return this.mainIdeas;
    }

    setMainIdeas(ideas){
        this.mainIdeas = ideas;
    }
}