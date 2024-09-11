import {BaseParagraph} from "./BaseParagraph.js";

const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});
const llmModule = require("assistos").loadModule("llm", {});

export class ImageParagraph extends BaseParagraph {
    constructor(element, invalidate) {
        super(element, invalidate);
    }

    async subscribeToParagraphEvents() {
        await utilModule.subscribeToObject(this.paragraph.id, async (type) => {
            this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
            this.invalidate();
        });
    }

    beforeRender() {
    }


    afterRender() {

    }
}
