const documentModule = require('assistos').loadModule('document', {});

export class ExportDocumentModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentId = this.element.getAttribute('data-id');
        this.documentTitle = this.element.getAttribute('data-title');
        this.boundsOnCompleteExport = this.onCompleteExport.bind(this);
        this.invalidate();

        this.formData = {};
        this.settings = {
            title: {font: 'Arial', bold: false, italic: false, fontSize: 20, color: '#000000'},
            abstract: {font: 'Arial', bold: false, italic: false, fontSize: 14, color: '#000000'},
            chapters: {font: 'Arial', bold: false, italic: false, fontSize: 18, color: '#000000'},
            paragraphs: {font: 'Arial', bold: false, italic: false, fontSize: 14, color: '#000000'}
        };
    }

    beforeRender() {

    }

    async afterRender(){
        this.collectFormData();
        this.setupDynamicSection();
    }

    async closeModal() {
        await assistOS.UI.closeModal(this.element);
    }

    async onCompleteExport(status) {
        if (status === "failed") {
            showApplicationError("Export failed", data.error);
            assistOS.UI.closeModal(this.element);
        } else if (status === "completed") {
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
        if (this.exportType === 'full') {
            a.download = `${assistOS.UI.unsanitize(this.documentTitle)}.docai`;
        } else {
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
        } catch (e) {
            button.classList.remove('loading-icon');
            button.innerHTML = 'Export';
        }
    }

    async exportDOCX() {
        const spaceId = assistOS.space.id;
        const documentId = this.documentId;

        this.settings = await this.showCustomizationModal();
        if (!this.settings) {
            alert("Cancelled export");
            return;
        }

        let responseBuffer;
        try {
            console.log("Settings sent to server:", JSON.stringify(this.settings));

            // Trimiterea request-ului cu settings în body
            const response = await fetch(`/documents/export/docx/${spaceId}/${documentId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ settings: this.settings })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            responseBuffer = await response.arrayBuffer();
        } catch (error) {
            alert(`Error exporting document as DOCX: ${error.message || error}`);
            return;
        }

        const blob = new Blob([responseBuffer], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Space:${spaceId}_Document:${documentId}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    async showCustomizationModal() {
        return new Promise((resolve) => {
            const modal = document.getElementById("customizationModal");
            modal.style.display = "block";
            this.setupDynamicSection();

            document.querySelectorAll("#customizationModal input, #customizationModal select").forEach(input => {
                input.addEventListener("change", () => this.collectFormData());
            });

            document.getElementById("saveSettings").onclick = () => {
                this.collectFormData();
                modal.style.display = "none";
                resolve(this.settings);
            };

            document.getElementById("cancelSettings").onclick = function () {
                modal.style.display = "none";
                resolve(null);
            };
        });
    }

    collectFormData() {
        const section = document.getElementById("sectionSelector").value;

        const getCheckedValue = (id) => document.getElementById(id).checked;

        if (!this.settings) this.settings = {};

        this.settings[section] = {
            font: document.getElementById("dynamicFont").value || "Helvetica",
            fontSize: document.getElementById("dynamicFontSize").value || 14,
            color: document.getElementById("dynamicColor").value || "#000000",
            bold: getCheckedValue("dynamicBoldStyle"),
            italic: getCheckedValue("dynamicItalicStyle"),
        };

        this.settings.backgroundColor = document.getElementById("backgroundColor").value || "#FFFFFF";
        this.settings.pageSize = document.getElementById("pageSize").value || "a4";
        this.settings.orientation = document.getElementById("orientation").value || "portrait";
        this.settings.paginationPosition = document.getElementById("paginationSelect").value || "center";
        this.settings.paginationStyle = document.getElementById("paginationStyle").value || "number";

        this.settings.topPadding = parseInt(document.getElementById("topPadding").value) || 10;
        this.settings.bottomPadding = parseInt(document.getElementById("bottomPadding").value) || 10;
        this.settings.leftPadding = parseInt(document.getElementById("leftPadding").value) || 10;
        this.settings.rightPadding = parseInt(document.getElementById("rightPadding").value) || 10;

        console.log("Form data collected:", this.settings);
    }

    setupDynamicSection() {
        const sectionSelector = document.getElementById("sectionSelector");
        const dynamicFont = document.getElementById("dynamicFont");
        const dynamicBoldStyle = document.getElementById("dynamicBoldStyle");
        const dynamicItalicStyle = document.getElementById("dynamicItalicStyle");
        const dynamicFontSize = document.getElementById("dynamicFontSize");
        const dynamicColor = document.getElementById("dynamicColor");

        if (!this.settings) this.settings = {};

        sectionSelector.addEventListener("change", () => {
            const selectedSection = sectionSelector.value;
            if (!this.settings[selectedSection]) {
                this.settings[selectedSection] = {
                    font: "Helvetica",
                    fontSize: 14,
                    color: "#000000",
                    bold: false,
                    italic: false,
                };
            }

            const sectionSettings = this.settings[selectedSection];

            dynamicFont.value = sectionSettings.font;
            dynamicBoldStyle.checked = sectionSettings.bold;
            dynamicItalicStyle.checked = sectionSettings.italic;
            dynamicFontSize.value = sectionSettings.fontSize;
            dynamicColor.value = sectionSettings.color;
        });

        const updateSettings = () => {
            const selectedSection = sectionSelector.value;
            this.settings[selectedSection] = {
                font: dynamicFont.value,
                bold: dynamicBoldStyle.checked,
                italic: dynamicItalicStyle.checked,
                fontSize: dynamicFontSize.value,
                color: dynamicColor.value,
            };
        };

        dynamicFont.addEventListener("change", updateSettings);
        dynamicBoldStyle.addEventListener("change", updateSettings);
        dynamicItalicStyle.addEventListener("change", updateSettings);
        dynamicFontSize.addEventListener("change", updateSettings);
        dynamicColor.addEventListener("change", updateSettings);
    }

    async exportHTML() {
        const spaceId = assistOS.space.id;
        const documentId = this.documentId;

        let htmlContent;
        try {
            console.log("No settings sent to server.");

            const response = await fetch(`/documents/export/html/${spaceId}/${documentId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            htmlContent = await response.text();
        } catch (error) {
            alert(`Error exporting document as HTML: ${error.message || error}`);
            return;
        }

        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.documentId}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

}