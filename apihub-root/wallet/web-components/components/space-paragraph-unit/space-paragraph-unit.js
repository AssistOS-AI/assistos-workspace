const {notificationService} = require("assistos").loadModule("util", {});
const spaceModule = require("assistos").loadModule("space", {});

export class SpaceParagraphUnit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentPresenter = document.querySelector("space-document-view-page").webSkelPresenter;
        this._document = this.documentPresenter._document;
        let paragraphId = this.element.getAttribute("data-paragraph-id");
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.paragraph = this.chapter.getParagraph(paragraphId);
        this.prepareToRenderImages = async () => {
            let imageRegex = /\{\s*&quot;imageId&quot;\s*:\s*&quot;([^,]+)&quot;\s*,\s*&quot;galleryId&quot;\s*:\s*&quot;([^}]+)&quot;\s*}/g;
            const imagesData = this.paragraph.text.match(imageRegex);
            if (imagesData) {
                for (let imageData of imagesData) {
                    const imgIdRegex = new RegExp(`${imageData}`, 'g');
                    let jsonData;
                    try {
                        let unsatiziedData = imageData.replace(/&quot;/g, '"');
                        jsonData = JSON.parse(unsatiziedData);
                    } catch (e) {
                        continue;
                    }
                    let imageUnitTag = `<image-unit data-presenter=\"image-unit\" data-id=\"${jsonData.imageId}\" data-gallery-id=\"${jsonData.galleryId}\" contenteditable=\"false\"></image-unit>`;
                    this.paragraphText = this.paragraph.text.replace(imgIdRegex, imageUnitTag);
                }
            }
        };
        this.invalidate(this.prepareToRenderImages);
    }

    beforeRender() {
        notificationService.on(this.paragraph.id, async () => {
            let ttsUnit = this.element.querySelector('text-to-speech-unit');
            if (ttsUnit) {
                this.openTTSUnit = true;
            }
            let paragraphDiv = this.element.querySelector(".paragraph-text");
            let paragraphText = assistOS.UI.sanitize(paragraphDiv.innerHTML);
            if (!paragraphText) {
                paragraphText = "";
            }
            this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
            if (paragraphText !== this.paragraph.text) {
                this.invalidate(this.prepareToRenderImages);
            }
        });
    }

    afterRender() {
        let paragraphText = this.element.querySelector(".paragraph-text");
        paragraphText.innerHTML = this.paragraphText || this.paragraph.text;
        let paragraphHeight = paragraphText.scrollHeight + 20;
        paragraphText.style.height = paragraphText.scrollHeight + 'px';
        if (this.openTTSUnit) {
            this.openPersonalitiesPopUp(this.element);
            this.openTTSUnit = false;
        }
        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphText.click();
        }
        if(assistOS.space.currentChapterId === this.chapter.id && assistOS.space.currentParagraphId !== this.paragraph.id){
            paragraphText.classList.add("unfocused");
        }
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

    saveParagraph(paragraph, event, swapAction) {
        if (!swapAction) {
            assistOS.space.currentParagraph = null;
        }
        if (paragraph["timer"]) {
            paragraph["timer"].stop(true);
        }
        paragraph["paragraph"].removeEventListener("keydown", this.resetTimer);
        paragraph["paragraph"].setAttribute("contenteditable", "false");
        if (!assistOS.UI.getClosestParentElement(event.target, "agent-page")) {
            paragraph["paragraph"].removeAttribute("id");
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
        paragraph.classList.remove("unfocused");
        paragraph.setAttribute("id", "highlighted-child-element");
        let paragraphUnit = assistOS.UI.reverseQuerySelector(paragraph, ".paragraph-unit");
        paragraph.focus();
        this.previouslySelectedParagraph = {};
        this.previouslySelectedParagraph["paragraph"] = paragraph;
        this.switchParagraphArrows(paragraphUnit, "on");
        assistOS.space.currentParagraphId = this.paragraph.id;
        let saved = false;
        let timer = assistOS.services.SaveElementTimer(async () => {
            if (!this.paragraph || assistOS.space.currentParagraphId !== this.paragraph.id) {
                await timer.stop();
                return;
            }
            let parsedText = await this.replaceImgTags(paragraph);
            let paragraphText = assistOS.UI.sanitize(parsedText);
            if (paragraphText !== this.paragraph.text && !saved) {
                saved = true;
                await assistOS.callFlow("UpdateParagraphText", {
                    spaceId: assistOS.space.id,
                    documentId: this._document.id,
                    chapterId: this.chapter.id,
                    paragraphId: this.paragraph.id,
                    text: paragraphText
                });
                saved = false;
            }
        }, 1000);
        this.previouslySelectedParagraph["timer"] = timer;
        this.resetTimer = async (event) => {
            paragraph.style.height = paragraph.scrollHeight + 'px';
            if (paragraph.innerText.trim() === "" && event.key === "Backspace") {
                if (assistOS.space.currentParagraphId === this.paragraph) {
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
        paragraph.addEventListener("blur", async (event) => {
            if(event.relatedTarget && event.relatedTarget.getAttribute("data-paragraph-id") === this.paragraph.id){
                return;
            }
            await timer.stop(true);
            paragraph.removeAttribute("id");
            this.switchParagraphArrows(paragraphUnit, "off");
        }, {once: true});

    }
    async replaceImgTags(paragraphTextElement){
        let clonedTag  = paragraphTextElement.cloneNode(true);
        let imgTags = clonedTag.querySelectorAll("image-unit");
        if(imgTags.length === 0){
            return paragraphTextElement.innerHTML;
        }
        for(let imgTag of imgTags){
            let imgId = imgTag.getAttribute("data-id");
            let galleryId = imgTag.getAttribute("data-gallery-id");
            if(!imgId || !galleryId){
                continue;
            }
            let imagesIdsString = `{"imageId":"${imgId}","galleryId":"${galleryId}"} `;
            this.replaceElementWithText(imgTag, imagesIdsString, clonedTag);
        }
        return clonedTag.innerHTML;
    }
    replaceElementWithText(element, replacementText) {
        const textNode = document.createTextNode(replacementText);
        if (element.parentNode) {
            element.parentNode.replaceChild(textNode, element);
        }
    }

    openPersonalitiesPopUp(_target) {
        let personalitiesPopUp = `<text-to-speech-unit data-presenter="select-personality-tts" data-chapter-id="${this.chapter.id}" data-paragraph-id="${this.paragraph.id}"></text-to-speech-unit>`;
        this.element.insertAdjacentHTML('beforeend', personalitiesPopUp);
    }
}