import {generateId} from "../../../../imports.js";
export class AddComment {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.element.classList.add('maintain-focus');
        this.invalidate();
    }

    beforeRender() {

    }

    afterRender() {
        this.textArea = this.element.querySelector('#comment');
        let addCommentButton = this.element.querySelector('.add-comment');
        this.textArea.addEventListener('input', (e) =>{
            if(e.target.value.trim() === ""){
                addCommentButton.classList.add("disabled");
            } else{
                addCommentButton.classList.remove("disabled");
            }
        });

    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async addComment(_target) {

        let message = {
            id: generateId(8),
            userEmail: assistOS.user.email,
            message: this.textArea.value
        }
        assistOS.UI.closeModal(_target, message);
    }
}
