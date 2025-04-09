const documentModule = require('assistos').loadModule('document',{});

function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

export class ChapterCommentMenu {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();

    }

    beforeRender() {
        let chapterElement = assistOS.UI.reverseQuerySelector(this.element, 'chapter-item');
        this.chapterPresenter = chapterElement.webSkelPresenter;
        this.chapterComment = this.chapterPresenter.chapter.comments;
        this.chapterId=this.chapterPresenter.chapter.id;
        this.documentId = this.chapterPresenter._document.id;
        this.debouncedUpdateComment = debounce(this.updateChapterComment, 1000).bind(this);
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

    async updateChapterComment() {
        const showSaveToolTip = ()=>{
            this.element.querySelector('.saveToolTip').style.display = 'block';
            setTimeout(() => {
                this.element.querySelector('.saveToolTip').style.display = 'none';
            },500);
        }
        if (this.textArea.value === this.chapterComment) {
            return;
        }
        let chapter = this.chapterPresenter.chapter;
        this.chapterComment = this.textArea.value;
        chapter.comments = this.textArea.value;
        await documentModule.updateChapter(assistOS.space.id, chapter.id,
            undefined,
            chapter.comments,
            undefined);
        showSaveToolTip();
    }
}
