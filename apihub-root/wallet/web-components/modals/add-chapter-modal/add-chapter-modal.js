import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";

export class addChapterModal {
    constructor() {
        setTimeout(()=> {
            this.invalidate()
        }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    addSelectedIdeas(_target) {
        closeModal(_target);
    }
}