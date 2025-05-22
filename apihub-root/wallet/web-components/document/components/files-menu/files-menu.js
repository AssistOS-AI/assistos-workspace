const spaceModule = assistOS.loadModule("space");
export class FilesMenu{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.paragraphPresenter = this.element.closest("paragraph-item").webSkelPresenter;
        this.paragraph = this.paragraphPresenter.paragraph;
        this.invalidate();
    }
    beforeRender(){
        let filesHTML = "";
        let headerHTML = `<div class="no-files">no files uploaded</div>`;
        if(this.paragraph.commands.files && this.paragraph.commands.files?.length > 0){
            headerHTML = `<div class="files-header">
                                        <span class="file-name">Name</span>
                                        <span class="file-type">Type</span>
                                        <span class="file-size">Size</span>
                                        <span class="download-file-header">Download</span>
                                        <span>Delete</span>
                                    </div>`;
            for (let file of this.paragraph.commands.files) {
                filesHTML += `<div class="paragraph-file">
                                          <div class="file-name">${file.name}</div>
                                          <div class="file-type">${file.type}</div>
                                          <div class="file-size">${this.formatFileSize(file.size)}</div>
                                          <img class="download-file pointer" data-local-action="downloadFile ${file.id}" src="./wallet/assets/icons/download.svg" alt="download">
                                          <img class="delete-file pointer" data-local-action="deleteFile ${file.id}" src="./wallet/assets/icons/trash-can.svg" alt="delete">
                                        </div>`;
            }
        }
        this.filesHTML=`${headerHTML}${filesHTML}`;
    }
    afterRender(){

    }
    async insertFile() {
        await this.paragraphPresenter.commandsEditor.insertAttachmentCommand("files");
        let filesMenu = this.paragraphPresenter.element.querySelector(".files-menu");
        filesMenu.classList.add("highlight-attachment");
        this.invalidate();
    }
    async deleteFile(targetElement, fileId){
        await this.paragraphPresenter.commandsEditor.deleteCommand("files", fileId);
        if(this.paragraph.commands.files.length === 0){
            let filesMenu = this.paragraphPresenter.element.querySelector(".files-menu");
            filesMenu.classList.remove("highlight-attachment");
        }
        this.invalidate();
    }
    async downloadFile(targetElement, fileId){
        let file = this.paragraph.commands.files.find(file => file.id === fileId);
        let downloadURL = await spaceModule.getFileURL(file.id);

        const response = await fetch(downloadURL);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const blob = await response.blob();

        const link = document.createElement('a');
        link.classList.add("insert-modal", "maintain-focus");
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    }
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }
}