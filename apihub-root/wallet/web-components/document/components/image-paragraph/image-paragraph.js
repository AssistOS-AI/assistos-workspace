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
        if(this.paragraph.lipSync){
            this.lipSyncState = "done";
        }
        this.initialized = false;
        this.imageSrc = this.paragraph.image.src;
        this.imageAlt = this.paragraph.image.timestamp;
    }
    renderImageMaxWidth(){
        let originalWidth = parseFloat(getComputedStyle(this.imgElement, null).getPropertyValue('width').replace('px', ''));
        let originalHeight = parseFloat(getComputedStyle(this.imgElement, null).getPropertyValue('height').replace('px', ''));
        const aspectRatio = originalWidth / originalHeight;
        const maxWidth = this.parentChapterElement.getBoundingClientRect().width - 78;
        const maxHeight = maxWidth / aspectRatio;
        this.imgElement.style.width = maxWidth + 'px';
        this.imgElement.style.height = maxHeight + 'px';
    }
    afterRender() {
        this.imgElement = this.element.querySelector(".paragraph-image");
        if(this.paragraph.dimensions){
            this.imgElement.style.width = this.paragraph.dimensions.width + "px";
            this.imgElement.style.height = this.paragraph.dimensions.height + "px";
            setTimeout(() => {
                this.initialized = true;
            }, 0);
        } else {
            this.imgElement.addEventListener('load', this.renderImageMaxWidth.bind(this), {once: true});
        }
        this.imgContainer = this.element.querySelector('.img-container');
        let paragraphImage = this.element.querySelector(".paragraph-image");
        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphImage.click();
        }
        const handlesNames = ["ne", "se", "sw", "nw"];
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
        if(!this.boundMouseDownFN){
            this.boundMouseDownFN = this.mouseDownFn.bind(this);
            for(let key of Object.keys(handles)){
                handles[key].addEventListener('mousedown', this.boundMouseDownFN);
            }
        }

        this.changeLipSyncUIState();
        this.parentChapterElement = this.element.closest("chapter-item");
    }
    mouseDownFn(event) {
        event.preventDefault();
        this.originalWidth = parseFloat(getComputedStyle(this.imgElement, null).getPropertyValue('width').replace('px', ''));
        this.originalHeight = parseFloat(getComputedStyle(this.imgElement, null).getPropertyValue('height').replace('px', ''));
        this.originalX = this.imgContainer.getBoundingClientRect().left;
        this.originalY = this.imgContainer.getBoundingClientRect().top;
        this.originalMouseX = event.pageX;
        this.originalMouseY = event.pageY;
        this.boundResize = this.resize.bind(this);
        document.addEventListener('mousemove', this.boundResize);
        document.addEventListener('mouseup', this.stopResize.bind(this), {once: true});
    }

    async resize(e) {
        const aspectRatio = this.originalWidth / this.originalHeight;
        let width = this.originalWidth + (e.pageX - this.originalMouseX);
        let height = width / aspectRatio;

        const maxWidth = this.parentChapterElement.getBoundingClientRect().width - 78;
        if (width > maxWidth) {
            width = maxWidth;
            height = maxWidth / aspectRatio;
        }
        if (width > 20 && height > 20) {
            this.imgElement.style.width = width + 'px';
            this.imgElement.style.height = height + 'px';
        }
        await this.documentPresenter.resetTimer();
    }
    async stopResize() {
        document.removeEventListener('mousemove', this.boundResize);
        await this.documentPresenter.stopTimer(true);
    }
    switchParagraphArrows(mode) {
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
                 `;
            if(this.lipSyncState === "generating"){
                baseDropdownMenuHTML += `<list-item class="disabled-pointer-events" data-local-action="lipSync" data-name="Generating Lip Sync..." data-highlight="light-highlight"></list-item>`;
            } else {
                baseDropdownMenuHTML += `<list-item data-local-action="lipSync" data-name="Lip Sync" data-highlight="light-highlight"></list-item>`;
            }
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
    async lipSync(targetElement){
        let paragraphIndex = this.chapter.paragraphs.findIndex(paragraph => paragraph.id === this.paragraph.id);
        let nextParagraph = this.chapter.paragraphs[paragraphIndex + 1];
        if(!nextParagraph){
            return await showApplicationError("Lip Sync Error","No next paragraph found to extract audio from. This is the last paragraph in the chapter.");
        }
        if(!nextParagraph.audio){
            return await showApplicationError("Lip Sync Error","No audio found in the next paragraph to lip sync to.");
        }
        this.lipSyncState = "generating";
        this.changeLipSyncUIState();
        let dropdownMenu = this.element.querySelector('.dropdown-menu-container');
        dropdownMenu.remove();
        const videoId = await llmModule.lipSync(assistOS.space.id,this.paragraph.image.src, nextParagraph.audio.src, "sync-1.6.0");
        await utilModule.subscribeToObject(videoId, async () => {
            await utilModule.unsubscribeFromObject(videoId);
            let paragraphLipSync = {
                id: videoId,
                src: `spaces/image/${assistOS.space.id}/${videoId}`
            }
            await documentModule.updateImageParagraphLipSync(assistOS.space.id, this._document.id, this.paragraph.id, paragraphLipSync);
            this.paragraph.lipSync = paragraphLipSync;
            this.lipSyncState = "done";
            this.invalidate();
        });
    }
    changeLipSyncUIState(){
        let paragraphControls = this.element.querySelector('.paragraph-controls');
        if(this.lipSyncState === "generating"){
            paragraphControls.insertAdjacentHTML('beforeend', `<div class="loading-icon small top-margin"></div>`);
        } else if(this.lipSyncState === "done"){
            let playButton = this.element.querySelector('.play-lip-sync');
            playButton.style.display = "block";
        }
    }
    playLipSyncVideo(playButton) {
        let videoTagContainer = `
        <div class="video-container">
            <video controls autoplay class="lip-sync-video" src="${this.paragraph.lipSync.src}"></video>
            <img src="./wallet/assets/icons/x-mark.svg" data-local-action="closePlayer" class="close-player pointer" alt="close"/>
        </div>`;
        playButton.insertAdjacentHTML('afterend', videoTagContainer);
    }

    closePlayer() {
        let videoContainer = this.element.querySelector('.video-container');
        videoContainer.remove();
    }
}