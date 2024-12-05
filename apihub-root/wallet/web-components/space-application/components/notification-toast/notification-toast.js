export class NotificationToast {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.downloadURL = this.element.getAttribute('data-url');
        this.fileName = decodeURIComponent(this.element.getAttribute('data-file-name'));
    }
    beforeRender() {

    }
    afterRender() {
        if(this.downloadURL){
            let downloadButton = this.element.querySelector('.download-button');
            downloadButton.classList.remove('hidden');
        }
    }
    executeDownload() {
        let a = document.createElement('a');
        a.style.display = 'none';
        a.href = this.downloadURL;
        a.download = this.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    removeComponent(){
        this.element.remove();
    }
}