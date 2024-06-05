export class InsertImageModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let chapterId = this.element.getAttribute("data-chapter-id");
        this._document = document.querySelector("space-document-view-page").webSkelPresenter._document;
        this.chapter = this._document.getChapter(chapterId);
        this.modalBody = `
            <div class="modal-body">
                <button data-local-action="openGallerySection">From Gallery</button>
                <button data-local-action="openGenerateSection">Generate</button>
            </div>`;
        this.invalidate();
    }

    beforeRender() {
        this.generateSection = `
        <form class="modal-body generate-section">
            <div class="form-item">
                <label class="modal-label" for="prompt">Prompt</label>
                <textarea class="form-input" name="prompt" id="prompt" data-id="prompt"></textarea>
            </div>
            <div class="modal-footer">
                <button type="button" class="general-button" data-local-action="changePersonality">Generate image</button>
            </div>
        </form>`;
        this.gallerySection = `
        <div class="modal-body gallery-section">
         to be done
        </div>`;
    }

    afterRender() {
        if(this.modalBody === this.generateSection){
            let input = this.element.querySelector('#prompt');
            let inputValue = "";
            for (let paragraph of this.chapter.paragraphs) {
                inputValue += paragraph.text;
            }
            input.value = inputValue;
        }

    }
    openGenerateSection(){
        this.modalBody = this.generateSection;
        this.invalidate();
    }
    openGallerySection(){
        this.modalBody = this.gallerySection;
        this.invalidate();
    }
    closeModal(_target){
        assistOS.UI.closeModal(_target);
    }
}