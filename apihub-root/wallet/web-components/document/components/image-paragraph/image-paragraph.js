import {BaseParagraph} from "./BaseParagraph.js";
const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});
const llmModule = require("assistos").loadModule("llm", {});
export class ImageParagraph extends BaseParagraph{
    constructor(element, invalidate) {
        super(element, invalidate);
    }
    async subscribeToParagraphEvents(){
        await utilModule.subscribeToObject(this.paragraph.id, async (type) => {
            if (type === "lipSync") {
                this.paragraph.lipSync = await documentModule.getImageParagraphLipSync(assistOS.space.id, this._document.id, this.paragraph.id);
            } else {
                this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
            }
            this.invalidate();
        });
    }
    beforeRender() {
        this.initialized = false;
        this.imageSrc = this.paragraph.image.src;
        this.imageAlt = this.paragraph.image.timestamp;
    }
    afterRender() {
        this.imgElement = this.element.querySelector(".paragraph-image");
        if(this.paragraph.dimensions){
            this.imgElement.style.width = this.paragraph.dimensions.width + "px";
            this.imgElement.style.height = this.paragraph.dimensions.height + "px";
            setTimeout(() => {
                this.initialized = true;
            }, 0);
        }
        this.imgContainer = this.element.querySelector('.img-container');
        let paragraphImage = this.element.querySelector(".paragraph-image");
        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphImage.click();
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
        let playButton = this.element.querySelector('.play-button');
        if(this.paragraph.lipSync){
            playButton.style.display = "block";
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
        document.addEventListener('mouseup', this.stopResize.bind(this, handle), {once: true});
    }

    resize = {
        nw: async function(e) {
            const aspectRatio = this.originalWidth / this.originalHeight;
            const width = this.originalWidth - (e.pageX - this.originalMouseX);
            const height = width / aspectRatio;
            if (width > 20 && height > 20) {
                this.imgElement.style.width = width + 'px';
                this.imgElement.style.height = height + 'px';
            }
            await this.documentPresenter.resetTimer();
        },
        ne: async function(e) {
            const aspectRatio = this.originalWidth / this.originalHeight;
            const width = this.originalWidth + (e.pageX - this.originalMouseX);
            const height = width / aspectRatio;
            if (width > 20 && height > 20) {
                this.imgElement.style.width = width + 'px';
                this.imgElement.style.height = height + 'px';
            }
            await this.documentPresenter.resetTimer();
        },
        sw: async function(e) {
            const aspectRatio = this.originalWidth / this.originalHeight;
            const width = this.originalWidth - (e.pageX - this.originalMouseX);
            const height = width / aspectRatio;
            if (width > 20 && height > 20) {
                this.imgElement.style.width = width + 'px';
                this.imgElement.style.height = height + 'px';
            }
            await this.documentPresenter.resetTimer();
        },
        se: async function(e) {
            const aspectRatio = this.originalWidth / this.originalHeight;
            const width = this.originalWidth + (e.pageX - this.originalMouseX);
            const height = width / aspectRatio;
            if (width > 20 && height > 20) {
                this.imgElement.style.width = width + 'px';
                this.imgElement.style.height = height + 'px';
            }
            await this.documentPresenter.resetTimer();
        },
        n: async function(e) {
            const height = this.originalHeight - (e.pageY - this.originalMouseY);
            if (height > 20) {
                this.imgElement.style.height = height + 'px';
            }
            await this.documentPresenter.resetTimer();
        },
        e: async function(e) {
            const width = this.originalWidth + (e.pageX - this.originalMouseX);
            if (width > 20) {
                this.imgElement.style.width = width + 'px';
            }
            await this.documentPresenter.resetTimer();
        },
        s: async function(e) {
            const height = this.originalHeight + (e.pageY - this.originalMouseY);
            if (height > 20) {
                this.imgElement.style.height = height + 'px';
            }
            await this.documentPresenter.resetTimer();
        },
        w: async function(e) {
            const width = this.originalWidth - (e.pageX - this.originalMouseX);
            if (width > 20) {
                this.imgElement.style.width = width + 'px';
            }
            await this.documentPresenter.resetTimer();
        }
    };
    async stopResize(handle, event) {
        this.element.removeEventListener('mousemove', this.resize[handle].boundFn);
        await this.documentPresenter.stopTimer(true);
    }
    switchParagraphArrows(mode) {
        if (this.chapter.paragraphs.length <= 1) {
            return;
        }
        let arrows = this.element.querySelector('.paragraph-controls');
        if (mode === "on") {
            arrows.style.visibility = "visible";
        } else {
            arrows.style.visibility = "hidden";
        }
    }


    async saveParagraph() {
        if (!this.paragraph || assistOS.space.currentParagraphId !== this.paragraph.id) {
            await this.documentPresenter.stopTimer();
            return;
        }
        let imageElement = this.element.querySelector(".paragraph-image");
        let dimensions = {
            width: imageElement.width,
            height: imageElement.height
        };
        if ((dimensions.width !== this.paragraph.dimensions.width || dimensions.height!==this.paragraph.dimensions.height) && this.initialized) {
            this.paragraph.dimensions.width = dimensions.width;
            this.paragraph.dimensions.height = dimensions.height;
            await documentModule.updateImageParagraphDimensions(assistOS.space.id,
                this._document.id,
                this.paragraph.id,
                dimensions);
        }
    }
    highlightParagraph() {
        let dragBorder = this.element.querySelector(".drag-border");
        dragBorder.style.display = "block";
        this.switchParagraphArrows("on");
        assistOS.space.currentParagraphId = this.paragraph.id;
    }
    focusOutHandler() {
        this.switchParagraphArrows("off");
        let dragBorder = this.element.querySelector(".drag-border");
        dragBorder.style.display = "none";
    }

    async resetTimer(paragraph, event){
        if (event.key === "Backspace") {
            if (assistOS.space.currentParagraphId === this.paragraph.id) {
                await this.documentPresenter.stopTimer(false);
                await this.deleteParagraph();
            }
        }
    }
    async copy(){
        try {
            await navigator.clipboard.writeText(this.paragraph.image.src)
        } catch (e) {
            console.error(e);
        }
        const dropdownMenu = this.element.querySelector('.dropdown-menu-container');
        dropdownMenu.remove();
    }
    openParagraphDropdown(element){
        const generateDropdownMenu = () => {
            let baseDropdownMenuHTML =
                    `<list-item data-local-action="deleteParagraph" data-name="Delete"
                           data-highlight="light-highlight"></list-item>
                    <list-item data-local-action="copy" data-name="Copy"
                           data-highlight="light-highlight"></list-item>
                    <list-item data-local-action="openInsertImageModal" data-name="Insert Image"
                           data-highlight="light-highlight"></list-item>
                    <list-item data-local-action="lipSync" data-name="Lip Sync"
                           data-highlight="light-highlight"></list-item>              
                 `;
            let chapterElement = this.element.closest("chapter-item");
            let chapterPresenter = chapterElement.webSkelPresenter;
            if (chapterPresenter.chapter.paragraphs.length > 1) {
                baseDropdownMenuHTML = `
                <list-item data-local-action="moveParagraph up" data-name="Move Up"
                           data-highlight="light-highlight"></list-item>
                <list-item data-local-action="moveParagraph down" data-name="Move Down"
                           data-highlight="light-highlight"></list-item>` + baseDropdownMenuHTML;
            }
            let dropdownMenuHTML =
                `<div class="dropdown-menu">` +
                baseDropdownMenuHTML +
                `</div>`;

            const dropdownMenu = document.createElement('div');
            dropdownMenu.classList.add('dropdown-menu-container');
            dropdownMenu.innerHTML = dropdownMenuHTML;
            return dropdownMenu;
        }

        const dropdownMenu = generateDropdownMenu();
        this.element.appendChild(dropdownMenu);

        const removeDropdown = () => {
            dropdownMenu.remove();
        }

        dropdownMenu.addEventListener('mouseleave', removeDropdown);
        dropdownMenu.focus();
    }
    async lipSync(){
        let paragraphIndex = this.chapter.paragraphs.findIndex(paragraph => paragraph.id === this.paragraph.id);
        let nextParagraph = this.chapter.paragraphs[paragraphIndex + 1];
        if(!nextParagraph){
            return await showApplicationError("Lip Sync Error","No next paragraph found to extract audio from. This is the last paragraph in the chapter.");
        }
        if(!nextParagraph.audio){
            return await showApplicationError("Lip Sync Error","No audio found in the next paragraph to lip sync to.");
        }
        const videoId = await llmModule.lipSync(assistOS.space.id,this.paragraph.image.src, nextParagraph.audio.src, "sync-1.6.0");
        await utilModule.subscribeToObject(videoId, async () => {
            await utilModule.unsubscribeFromObject(videoId);
            let loadingIcon = this.element.querySelector('.loading-icon');
            loadingIcon.remove();
            let paragraphLipSync = {
                id: videoId,
                src: `spaces/image/${assistOS.space.id}/${videoId}`
            }
            await documentModule.updateImageParagraphLipSync(assistOS.space.id, this._document.id, this.paragraph.id, paragraphLipSync);
            this.paragraph.lipSync = paragraphLipSync;
            this.invalidate();
        });
        let paragraphControls = this.element.querySelector('.paragraph-controls');
        paragraphControls.insertAdjacentHTML('beforeend', `<div class="loading-icon small top-margin"></div>`);
    }
}