const documentModule = require('assistos').loadModule('document',{});

function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

export class DocumentCommentMenu {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        let documentElement = assistOS.UI.reverseQuerySelector(this.element, 'document-view-page');
        this.documentPresenter = documentElement.webSkelPresenter;
        this.documentComments = this.documentPresenter._document.comments;
        this.documentId = this.documentPresenter._document.id;
        this.debouncedUpdateComment = debounce(this.updateDocumentComment, 1000).bind(this);
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

    async updateDocumentComment() {
        const showSaveToolTip = ()=>{
            this.element.querySelector('.saveToolTip').style.display = 'block';
            setTimeout(() => {
                this.element.querySelector('.saveToolTip').style.display = 'none';
            },500);
        }
        if (this.textArea.value === this.documentComments) return;
        await documentModule.updateDocument(
            assistOS.space.id,
            this.documentId,
            undefined, undefined, undefined, undefined, this.textArea.value);
        this.documentComments = this.textArea.value;
        this.documentPresenter._document.comments = this.textArea.value;
        showSaveToolTip();
    }
}
