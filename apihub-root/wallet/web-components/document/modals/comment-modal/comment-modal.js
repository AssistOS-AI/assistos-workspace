export class CommentModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.comments = this.element.getAttribute('data-comments');
        this.element.classList.add('maintain-focus');
        this.invalidate();
    }

    beforeRender() {

    }

    afterRender() {
        this.textArea = this.element.querySelector('#comment');
        this.textArea.value = this.comments;

    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async updateComment(_target) {
        if (this.textArea.value === this.comments) {
            assistOS.UI.closeModal(_target);
            return;
        }
        assistOS.UI.closeModal(_target, this.textArea.value);
    }
}
