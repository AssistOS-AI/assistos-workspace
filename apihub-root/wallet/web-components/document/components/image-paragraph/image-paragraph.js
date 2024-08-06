import {BaseParagraph} from "./BaseParagraph.js";
const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});
export class ImageParagraph extends BaseParagraph{
    constructor(element, invalidate) {
        super(element, invalidate);
    }
    async subscribeToParagraphEvents(){
        await utilModule.subscribeToObject(this.paragraph.id, async () => {
            this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
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
        let arrows = this.element.querySelector('.paragraph-arrows');
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
                `<div class="dropdown-item" data-local-action="deleteParagraph">Delete</div>
                 <div class="dropdown-item" data-local-action="copy">Copy</div>
                 <div class="dropdown-item" data-local-action="openInsertImageModal">Insert Image</div>`;
            let chapterElement = this.element.closest("chapter-item");
            let chapterPresenter = chapterElement.webSkelPresenter;
            if (chapterPresenter.chapter.paragraphs.length > 1) {
                baseDropdownMenuHTML = `
                <div class="dropdown-item" data-local-action="moveParagraph up">Move Up</div>
                <div class="dropdown-item" data-local-action="moveParagraph down">Move Down</div>` + baseDropdownMenuHTML;
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
}