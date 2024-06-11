const {notificationService} = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});
export class ImageParagraph{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentPresenter = document.querySelector("space-document-view-page").webSkelPresenter;
        this._document = this.documentPresenter._document;
        let paragraphId = this.element.getAttribute("data-paragraph-id");
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.paragraph = this.chapter.getParagraph(paragraphId);
        this.invalidate();
    }

    beforeRender() {
        this.imageSrc = this.paragraph.image.src;
        this.imageAlt = this.paragraph.image.alt;
        notificationService.on(this.paragraph.id, async () => {
            let paragraphImg = this.element.querySelector(".paragraph-image").src;
            this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
            if (paragraphImg !== this.paragraph.image.src) {
                this.invalidate();
            }
        });
    }
    afterRender() {
        this.chapterPresenter = this.element.closest("space-chapter-unit").webSkelPresenter;
        this.imgElement = this.element.querySelector(".paragraph-image");
        if(this.paragraph.dimensions){
            this.imgElement.style.width = this.paragraph.dimensions.width + "px";
            this.imgElement.style.height = this.paragraph.dimensions.height + "px";
        }
        this.imgContainer = this.element.querySelector('.img-container');
        let paragraphImage = this.element.querySelector(".paragraph-image");
        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphImage.click();
        }
        if (assistOS.space.currentChapterId === this.chapter.id && assistOS.space.currentParagraphId !== this.paragraph.id) {
            paragraphImage.classList.add("unfocused");
        }
        const handlesNames = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
        let handles= {};
        for(let handleName of handlesNames){
            handles[handleName] = this.element.querySelector(`.${handleName}`);
        }
        this.originalWidth = 0;
        this.originalHeight = 0;
        this.originalX = 0;
        this.originalY = 0;
        this.originalMouseX = 0;
        this.originalMouseY = 0;
        for(let key of Object.keys(handles)){
            handles[key].addEventListener('mousedown', this.mouseDownFn.bind(this, key));
        }

    }
    mouseDownFn(handle, event) {
        event.preventDefault();
        this.originalWidth = parseFloat(getComputedStyle(this.imgElement, null).getPropertyValue('width').replace('px', ''));
        this.originalHeight = parseFloat(getComputedStyle(this.imgElement, null).getPropertyValue('height').replace('px', ''));
        this.originalX = this.imgContainer.getBoundingClientRect().left;
        this.originalY = this.imgContainer.getBoundingClientRect().top;
        this.originalMouseX = event.pageX;
        this.originalMouseY = event.pageY;
        let boundResize = this.resize[handle].bind(this);
        this.resize[handle].boundFn = boundResize;
        this.element.addEventListener('mousemove', boundResize);
        this.element.addEventListener('mouseup', this.stopResize.bind(this, handle));
    }

    resize = {
        nw: function(e) {
            const aspectRatio = this.originalWidth / this.originalHeight;
            const width = this.originalWidth - (e.pageX - this.originalMouseX);
            const height = width / aspectRatio;
            if (width > 20 && height > 20) {
                this.imgElement.style.width = width + 'px';
                this.imgElement.style.height = height + 'px';
            }
        },
        ne: function(e) {
            const aspectRatio = this.originalWidth / this.originalHeight;
            const width = this.originalWidth + (e.pageX - this.originalMouseX);
            const height = width / aspectRatio;
            if (width > 20 && height > 20) {
                this.imgElement.style.width = width + 'px';
                this.imgElement.style.height = height + 'px';
            }
        },
        sw: function(e) {
            const aspectRatio = this.originalWidth / this.originalHeight;
            const width = this.originalWidth - (e.pageX - this.originalMouseX);
            const height = width / aspectRatio;
            if (width > 20 && height > 20) {
                this.imgElement.style.width = width + 'px';
                this.imgElement.style.height = height + 'px';
            }
        },
        se: function(e) {
            const aspectRatio = this.originalWidth / this.originalHeight;
            const width = this.originalWidth + (e.pageX - this.originalMouseX);
            const height = width / aspectRatio;
            if (width > 20 && height > 20) {
                this.imgElement.style.width = width + 'px';
                this.imgElement.style.height = height + 'px';
            }
        },
        n: function(e) {
            const height = this.originalHeight - (e.pageY - this.originalMouseY);
            if (height > 20) {
                this.imgElement.style.height = height + 'px';
            }
        },
        e: function(e) {
            const width = this.originalWidth + (e.pageX - this.originalMouseX);
            if (width > 20) {
                this.imgElement.style.width = width + 'px';
            }
        },
        s: function(e) {
            const height = this.originalHeight + (e.pageY - this.originalMouseY);
            if (height > 20) {
                this.imgElement.style.height = height + 'px';
            }
        },
        w: function(e) {
            const width = this.originalWidth - (e.pageX - this.originalMouseX);
            if (width > 20) {
                this.imgElement.style.width = width + 'px';
            }
        }
    };
    stopResize(handle, event) {
        this.element.removeEventListener('mousemove', this.resize[handle].boundFn);
        this.element.removeEventListener('mouseup', this.stopResize);
    }
    switchParagraphArrows(target, mode) {
        if (this.chapter.paragraphs.length <= 1) {
            return;
        }
        let foundElement = target.querySelector('.paragraph-arrows');
        if (!foundElement) {
            let nextSibling = target.nextElementSibling;
            while (nextSibling) {
                if (nextSibling.matches('.paragraph-arrows')) {
                    foundElement = nextSibling;
                    break;
                }
                nextSibling = nextSibling.nextElementSibling;
            }
        }
        if (mode === "on") {
            foundElement.style.visibility = "visible";
        } else {
            foundElement.style.visibility = "hidden";
        }
    }

    async moveParagraph(_target, direction) {
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
    }
    editParagraph(paragraph) {
        let dragBorder = this.element.querySelector(".drag-border");
        dragBorder.style.display = "block";
        this.chapterPresenter.highlightChapter();
        paragraph.classList.remove("unfocused");
        paragraph.setAttribute("id", "highlighted-child-element");
        let paragraphUnit = assistOS.UI.reverseQuerySelector(paragraph, ".paragraph-unit");
        paragraph.focus();
        this.switchParagraphArrows(paragraphUnit, "on");
        assistOS.space.currentParagraphId = this.paragraph.id;
        let saved = false;
        let timer = assistOS.services.SaveElementTimer(async () => {
            if (!this.paragraph || assistOS.space.currentParagraphId !== this.paragraph.id) {
                await timer.stop();
                return;
            }
            let imageElement = this.element.querySelector(".paragraph-image");
            let dimensions = {
                width: imageElement.width,
                height: imageElement.height
            };
            if (dimensions !== this.paragraph.dimensions && !saved) {
                saved = true;
                await documentModule.updateImageParagraphDimensions(assistOS.space.id,
                    this._document.id,
                    this.paragraph.id,
                    dimensions);
                saved = false;
            }
        }, 1000);
        this.resetTimer = async (event) => {
            if (paragraph.value.trim() === "" && event.key === "Backspace") {
                if (assistOS.space.currentParagraphId === this.paragraph.id) {
                    let curentParagraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
                    await assistOS.callFlow("DeleteParagraph", {
                        spaceId: assistOS.space.id,
                        documentId: this._document.id,
                        chapterId: this.chapter.id,
                        paragraphId: this.paragraph.id
                    });
                    if (this.chapter.paragraphs.length > 0) {
                        if (curentParagraphIndex === 0) {
                            assistOS.space.currentParagraphId = this.chapter.paragraphs[0].id;
                        } else {
                            assistOS.space.currentParagraphId = this.chapter.paragraphs[curentParagraphIndex - 1].id;
                        }
                    } else {
                        assistOS.space.currentParagraphId = null;
                    }
                }
                await timer.stop();
            } else {
                await timer.reset(1000);
            }
        };
        paragraph.addEventListener("keydown", this.resetTimer);
        paragraph.addEventListener("focusout", async (event) => {
            if (event.relatedTarget && event.relatedTarget.getAttribute("data-paragraph-id") === this.paragraph.id) {
                return;
            }
            await timer.stop(true);
            paragraph.removeAttribute("id");
            this.switchParagraphArrows(paragraphUnit, "off");
            dragBorder.style.display = "none";
        }, {once: true});
    }
}