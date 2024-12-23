const documentModule = require('assistos').loadModule('document', {});
export class ExportDocumentModal{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentId = this.element.getAttribute('data-id');
        this.documentTitle = this.element.getAttribute('data-title');
        this.boundsOnCompleteExport = this.onCompleteExport.bind(this);
        this.invalidate();
    }
    beforeRender() {

    }
    async closeModal() {
        await assistOS.UI.closeModal(this.element);
    }
    async onCompleteExport(status) {
        if(status === "failed"){
            showApplicationError("Export failed", data.error);
            assistOS.UI.closeModal(this.element);
        } else if(status === "completed") {
            let exportButton = this.element.querySelector('.export-button');
            exportButton.classList.remove('loading-icon');
            exportButton.innerHTML = 'Download';
            exportButton.setAttribute('data-local-action', `downloadArchive`);
        }
    }

    async downloadArchive(targetElement) {
        const url = `/documents/export/${assistOS.space.id}/${this.taskId}`;
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        if(this.exportType === 'full') {
            a.download = `${assistOS.UI.unsanitize(this.documentTitle)}.docai`;
        }
        else {
            a.download = `${assistOS.UI.unsanitize(this.documentTitle)}_partial.docai`;
        }
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        await assistOS.UI.closeModal(this.element);
        delete this.taskId;
    }

    async exportDocument(button) {
        button.classList.add('loading-icon');
        button.innerHTML = '';

        let checkBox = this.element.querySelector('input[type="checkbox"]');
        this.exportType = checkBox.checked ? 'full' : 'partial';
        try {
            this.taskId = await documentModule.exportDocument(assistOS.space.id, this.documentId, this.exportType);
            await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, this.taskId, this.boundsOnCompleteExport);
        } catch (e){
            button.classList.remove('loading-icon');
            button.innerHTML = 'Export';
        }
    }
    async exportDOCX() {
        try {
            const spaceId = assistOS.space.id;
            const documentId = this.documentId;

            const response = await fetch(`/documents/export/docx/${spaceId}/${documentId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            if (!response.ok) {
                throw new Error(`Eroare la descărcare: ${response.statusText}`);
            }
            const responseData = await response.arrayBuffer();
            const blob = new Blob([responseData], {
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "document-exportat.docx";
            a.click();
            window.URL.revokeObjectURL(url);
            console.log("Document descărcat cu succes.");
        } catch (error) {
            console.error("Eroare la descărcarea documentului:", error);
        }
    }

}