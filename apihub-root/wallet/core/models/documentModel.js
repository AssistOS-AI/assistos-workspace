import { Chapter } from "./chapter.js";

export class DocumentModel {
    constructor(documentData) {
        this.title=documentData.title||"";
        this.abstract=documentData.abstract||"";
        this.chapters=(documentData.chapters||[]).map(chapterData=>new Chapter(chapterData));
        this.mainIdeas=documentData.mainIdeas||[];
        this.alternativeTitles=documentData.alternativeTitles||[];
        this.alternativeAbstracts=documentData.alternativeAbstracts||[];
        this.settings=documentData.settings||{llms:null,personality:null};
        this.currentChapterId=null;
        this.id=documentData.id||undefined;
    }

    toString() {
        return this.chapters.map(chapter => chapter.toString()).join("\n\n")||"";
    }
}