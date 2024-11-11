const documentModule = require('assistos').loadModule('document',{});

function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

export class ParagraphCommentMenu {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        let paragraphElement = assistOS.UI.reverseQuerySelector(this.element, 'paragraph-item');
        this.paragraphPresenter = paragraphElement.webSkelPresenter;
        this.paragraphComment = this.paragraphPresenter.paragraph.comment;
        this.paragraphId = this.paragraphPresenter.paragraph.id;
        this.documentId = this.paragraphPresenter._document.id;

        this.debouncedUpdateComment = debounce(this.updateParagraphComment, 1000).bind(this);
    }

    afterRender() {
        this.textArea = this.element.querySelector('.commentText');
        this.textArea.addEventListener('input', async () => {
            this.adjustTextAreaWidth();
            this.debouncedUpdateComment();
        });
    }

    adjustTextAreaWidth() {
        this.textArea.style.width = 'auto';
        this.textArea.style.width = `${this.textArea.scrollWidth}px`;
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async updateParagraphComment() {
        const showSaveToolTip = ()=>{
            this.element.querySelector('.saveToolTip').style.display = 'block';
            setTimeout(() => {
                this.element.querySelector('.saveToolTip').style.display = 'none';
            },500);
        }
        if (this.textArea.value === this.paragraphComment) return;
        await documentModule.updateParagraphComment(
            assistOS.space.id,
            this.documentId,
            this.paragraphId,
            this.textArea.value
        );
        this.paragraphComment = this.textArea.value;
        this.paragraphPresenter.paragraph.comment = this.textArea.value;
        showSaveToolTip();
        let commentHighlight = this.paragraphPresenter.element.querySelector(".attachment-circle.comment");
        if(this.paragraphPresenter.paragraph.comment.trim() !== ""){
            commentHighlight.classList.add("highlight-attachment");
        } else {
            commentHighlight.classList.remove("highlight-attachment");
        }
    }
}
