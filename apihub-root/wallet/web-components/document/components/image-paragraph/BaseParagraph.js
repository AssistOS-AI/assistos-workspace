export class BaseParagraph {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this._document = this.documentPresenter._document;
        let paragraphId = this.element.getAttribute("data-paragraph-id");
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.paragraph = this.chapter.getParagraph(paragraphId);
        this.invalidate(async () => {
            if (!this.documentPresenter.childrenSubscriptions.has(this.paragraph.id)) {
                await this.subscribeToParagraphEvents();
                this.documentPresenter.childrenSubscriptions.set(this.paragraph.id, this.paragraph.id);
            }
        });
    }

    getParagraphPosition() {
        if (this.chapter.paragraphs.length === 0) {
            return 0;
        }
        if (assistOS.space.currentParagraphId) {
            return this.chapter.paragraphs.findIndex(p => p.id === assistOS.space.currentParagraphId);
        }
        return this.chapter.paragraphs.length;
    }

    async openInsertImageModal(_target) {
        let position = this.getParagraphPosition() + 1;
        let imagesData = await assistOS.UI.showModal("insert-image-modal", {["chapter-id"]: this.chapter.id}, true);
        if (imagesData) {
            for (let image of imagesData) {
                await assistOS.callFlow("AddImageParagraph", {
                    spaceId: assistOS.space.id,
                    documentId: this._document.id,
                    chapterId: this.chapter.id,
                    paragraphData: {
                        position: position,
                        config:{
                            commands:{},
                            image:{
                                src:image.src,
                                alt:image.alt,
                                id:image.id,
                                isUploadedImage:image.isUploadedImage || false,
                                dimensions:{
                                    width:"",
                                    height:""
                                }
                            },
                            }
                        }
                });
                position++;
            }
            let chapterElement = this.element.closest("chapter-item");
            let chapterPresenter = chapterElement.webSkelPresenter;
            chapterPresenter.invalidate(chapterPresenter.refreshChapter);
        }
    }

    async deleteParagraph(_target) {
        await this.documentPresenter.stopTimer(true);
        let currentParagraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
        await assistOS.callFlow("DeleteParagraph", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId: this.chapter.id,
            paragraphId: this.paragraph.id
        });
        if (this.chapter.paragraphs.length > 0) {
            if (currentParagraphIndex === 0) {
                assistOS.space.currentParagraphId = this.chapter.paragraphs[0].id;
            } else {
                assistOS.space.currentParagraphId = this.chapter.paragraphs[currentParagraphIndex - 1].id;
            }
        } else {
            assistOS.space.currentParagraphId = null;
        }
        let chapterElement = this.element.closest("chapter-item");
        let chapterPresenter = chapterElement.webSkelPresenter;
        chapterPresenter.invalidate(chapterPresenter.refreshChapter);
    }

    async moveParagraph(_target, direction) {
        await this.documentPresenter.stopTimer(false);
        const currentParagraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
        const getAdjacentParagraphId = (index, paragraphs) => {
            if (direction === "up") {
                return index === 0 ? paragraphs[paragraphs.length - 1].id : paragraphs[index - 1].id;
            }
            return index === paragraphs.length - 1 ? paragraphs[0].id : paragraphs[index + 1].id;
        };
        const adjacentParagraphId = getAdjacentParagraphId(currentParagraphIndex, this.chapter.paragraphs);
        await assistOS.callFlow("SwapParagraphs", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId: this.chapter.id,
            paragraphId1: this.paragraph.id,
            paragraphId2: adjacentParagraphId
        });
        let chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
        chapterPresenter.invalidate(chapterPresenter.refreshChapter);
    }

    subscribeToParagraphEvents() {

    }

    addParagraph() {
        let chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
        let mockEvent = {
            ctrlKey: true,
            key: "Enter",
            target: this.element.querySelector(".paragraph-item")
        }
        chapterPresenter.addParagraphOrChapterOnKeyPress(mockEvent);
    }
}
