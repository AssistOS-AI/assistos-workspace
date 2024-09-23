const documentModule = require('assistos').loadModule('document', {});
export class ExportDocumentModal{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentId = this.element.getAttribute('data-document-id');
        this.documentTitle = this.element.getAttribute('data-document-title');
        this.invalidate();
    }
    beforeRender() {

    }
    async closeModal() {
        await assistOS.UI.closeModal(this.element);
    }
    async exportDocument(button) {
        button.classList.add('loading-icon');
        button.innerHTML = '';
        let checkBox = this.element.querySelector('input[type="checkbox"]');
        let exportType = checkBox.checked ? 'full' : 'partial';
        try {
            let archive = await documentModule.exportDocument(assistOS.space.id, this.documentId, exportType);
            const url = window.URL.createObjectURL(archive);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${assistOS.UI.unsanitize(this.documentTitle)}.docai`;

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            button.classList.remove('loading-icon');
            button.innerHTML = 'Export';
            await assistOS.UI.closeModal(this.element);
        } catch (e){
            button.classList.remove('loading-icon');
            button.innerHTML = 'Export';
        }
    }
}