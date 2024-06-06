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
            let galleries = [];
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
                    let gallery = galleries.find(gallery => gallery.id === jsonData.galleryId);
                    if (!gallery) {
                        gallery = await spaceModule.getGallery(assistOS.space.id, jsonData.galleryId);
                        if(!gallery) {
                            continue;
                        }
                        galleries.push(gallery);
                    }
                    let image = gallery.images.find(image => image.id === jsonData.imageId);
                    this.paragraph.text = this.paragraph.text.replace(imgIdRegex, `<img class="paragraph-image" data-id="${image.id}" data-gallery-id="${gallery.id}" src="${image.src}" alt="${image.timestamp}">`);
                }

                // for(let galleryId of galleryIds) {
                //     let gallery = this.gallery = await spaceModule.getGallery(assistOS.space.id, galleryId);
                //     const regex = /images_\w+/g;
                //     const imagesIds = this.paragraph.text.match(regex);
                //     if (imagesIds) {
                //         for (let imageId of imagesIds) {
                //             let image = gallery.images.find(image => image.id === imageId);
                //             const imgIdRegex = new RegExp(`${imageId}`, 'g');
                //             this.paragraph.text = this.paragraph.text.replace(imgIdRegex, `<img class="paragraph-image" data-id="${imageId}" data-gallery-id="${galleryId}" src="${image.src}" alt="${image.timestamp}">`);
                //         }
                //     }
                // }
            }
        };
        this.invalidate(this.prepareToRenderImages);
    }

    beforeRender() {
        this["data-paragraph-content"] = this.paragraph.text;
        notificationService.on(this.paragraph.id, async () => {
            let ttsUnit = this.element.querySelector('text-to-speech-unit');
            if (ttsUnit) {
                this.openTTSUnit = true;
            }
            let paragraphDiv = this.element.querySelector(".paragraph-text");
            let paragraphText = assistOS.UI.sanitize(assistOS.UI.customTrim(paragraphDiv.innerText));
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
        if (this.openTTSUnit) {
            this.openPersonalitiesPopUp(this.element);
            this.openTTSUnit = false;
        }
        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            let paragraphText = this.element.querySelector(".paragraph-text");
            paragraphText.click();
        }
    }

    openPersonalitiesPopUp(_target) {
        let personalitiesPopUp = `<text-to-speech-unit data-presenter="select-personality-tts" data-chapter-id="${this.chapter.id}" data-paragraph-id="${this.paragraph.id}"></text-to-speech-unit>`;
        this.element.insertAdjacentHTML('beforeend', personalitiesPopUp);
    }
}