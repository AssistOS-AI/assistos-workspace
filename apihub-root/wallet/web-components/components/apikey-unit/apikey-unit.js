import {
    showActionBox,
} from "../../../imports.js";
export class ApikeyUnit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate(async () => {
            this.key = {
                ...assistOS.space.getKey(this.element.getAttribute("data-key-type"), this.element.getAttribute("data-key-id")),
                "type": this.element.getAttribute("data-key-type")
            };
        });
    }

    beforeRender() {
        this.keyType =this.key.type
        this.keyValue=this.key.value
        this.keyUserId=this.key.userId
    }

    afterRender() {
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}