import { Paragraph } from './paragraph.js';

export class Chapter {
    constructor(chapterData) {
        this.title = chapterData.title;
        this.id = chapterData.id || webSkel.getService("UtilsService").generateId();
        this.visibility = "show";
        this.paragraphs = [];
        this.alternativeChapters=[]
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

    addParagraph(paragraphData,paragraphPosition){
        this.paragraphs.splice(paragraphPosition,0,new Paragraph(paragraphData));
    }

    addParagraphs(paragraphsData){
        for(let paragraph of paragraphsData){
            let paragraphData = {
                id: webSkel.servicesRegistry.UtilsService.generateId(),
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

    getMainIdeas(){
        return this.mainIdeas;
    }

    setMainIdeas(ideas){
        this.mainIdeas = ideas;
    }
}