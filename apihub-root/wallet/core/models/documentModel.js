import { Chapter } from "./chapter.js";
import {Settings} from "./settings.js";

export class DocumentModel {
    constructor(documentData) {

        for(const key in documentData) {
            if(key === "chapters") {
                this[key]=documentData[key].map(chapter => new Chapter(chapter));
            }else
            this[key] = documentData[key];
        }
        this.currentChapterId=null;

      /*  if(chapters !== undefined && chapters !== null) {
            let i = 0;
            while(chapters[i] !== undefined && chapters[i] !== null) {
                this.chapters.push(new Chapter(chapters[i].title, chapters[i].id, chapters[i].paragraphs));
                i++;
            }
        }*/

    }

    toString() {
        return this.chapters.map(chapter => chapter.toString()).join("\n\n")||"";
    }
}