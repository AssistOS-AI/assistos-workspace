import { showModal } from "../../../utils/modal-utils.js";
import { showActionBox } from "../../../../WebSkel/utils/modal-utils.js";

export class announcesPage {
    constructor(element) {
        this.announceDivs = "Here are the announces:";
        this.element = element;
        this.id = webSkel.company.currentDocumentId;
        if(webSkel.company.documents) {
            this._documentConfigs = (webSkel.company.documents);
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {
        //THIS IS JUST A PLACEHOLDER!!!
        let announces = [];
        let announce = {
            title: "Glass Menagerie",
            content: "The father-and-son duo Leopold and Rudolf Blaschka crafted thousands of scientifically accurate models of plants and sea creatures as teaching aids.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eu odio est. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nullam semper, eros vitae facilisis facilisis, diam odio bibendum magna, at volutpat ligula urna ornare neque. Nam pulvinar enim ut tellus."
        };
        for(let i = 0; i < 10; i++) {
            announces.push(announce);
        }

        this.announceDivs = "";
        announces.forEach((announce)=> {
            this.announceDivs += `<announce-renderer data-title="${announce.title}" data-content="${announce.content}"></announce-renderer>`;
        });
    }

    async showAddAnnounceModal() {
        await showModal(document.querySelector("body"), "add-announce-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}