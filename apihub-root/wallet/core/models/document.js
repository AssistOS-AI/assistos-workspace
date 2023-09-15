import { Chapter } from "./chapter.js";
import {LLM, Personality} from "../../imports";

export class Document {
    constructor(documentTitle, documentId, abstract, chapters, settings, alternativeTitles, alternativeAbstracts, mainIdeas) {
        this.title = documentTitle;
        if(documentId) {
            this.id = documentId;
        }
        this.abstract = abstract ? abstract : "";
        this.chapters = [];
        this.mainIdeas = mainIdeas ? mainIdeas : [];
        this.alternativeAbstracts=alternativeAbstracts||[];
        this.alternativeTitles = alternativeTitles ? alternativeTitles : [];
        if(chapters !== undefined && chapters !== null) {
            let i = 0;
            while(chapters[i] !== undefined && chapters[i] !== null) {
                this.chapters.push(new Chapter(chapters[i].title, chapters[i].id, chapters[i].paragraphs));
                i++;
            }
        }
        if(this.chapters && this.chapters.length > 0) {
            this.currentChapterId = this.chapters[0].id;
        } else {
            this.currentChapterId = undefined;
        }
        this.settings = settings ? settings : {llm:settings.llm || new LLM(), personality: settings.personality || new Personality()};
    }

    toString() {
        return this.chapters.map(chapter => chapter.toString()).join("\n\n");
    }
}