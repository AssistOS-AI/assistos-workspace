class addImageModal{
    constructor(element,invalidate){
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }
    beforeRender(){}
    afterRender(){}
    checkFileSize(inputElement) {
        const maxFileSize = 4 * 1024 * 1024;
        if (inputElement.files && inputElement.files[0].size > maxFileSize) {
            alert("The selected file exceeds the 4MB limit. Please choose a smaller file.");
            inputElement.value = "";
        }
    }

}