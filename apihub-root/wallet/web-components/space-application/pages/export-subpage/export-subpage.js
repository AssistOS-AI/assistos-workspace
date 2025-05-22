const documentModule = require('assistos').loadModule("document", {});
export class ExportSubpage {
    constructor(element, invalidate) {
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    async beforeRender() {
        const exportPreferences = await documentModule.getExportPreferences(assistOS.user.email);
        const selectedSection = exportPreferences["section"] || "Header";
        this.sections = ["Header", "Footer", "Body"].map(section =>
            `<option value="${section}" ${section === selectedSection ? "selected" : ""}>${section}</option>`
        ).join("");

        const selectedFont = exportPreferences["font"] || "Arial";
        this.fonts = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana"].map(font =>
            `<option value="${font}" ${font === selectedFont ? "selected" : ""}>${font}</option>`
        ).join("");

        const selectedFontStyle = exportPreferences["font-style"] || "Normal";
        this.fontStyles = ["Normal", "Italic", "Bold", "Bold Italic"].map(style =>
            `<option value="${style}" ${style === selectedFontStyle ? "selected" : ""}>${style}</option>`
        ).join("");

        const selectedFontSize = parseInt(exportPreferences["font-size"], 10) || 12;
        this.fontSizes = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72].map(size =>
            `<option value="${size}" ${size === selectedFontSize ? "selected" : ""}>${size}px</option>`
        ).join("");

        const selectedPosition = exportPreferences["position"] || "Left";
        this.positions = ["Left", "Center", "Right", "Top", "Bottom"].map(pos =>
            `<option value="${pos}" ${pos === selectedPosition ? "selected" : ""}>${pos}</option>`
        ).join("");

        const selectedStyle = exportPreferences["style"] || "Default";
        this.styles = ["Default", "Simple", "Fancy"].map(style =>
            `<option value="${style}" ${style === selectedStyle ? "selected" : ""}>${style}</option>`
        ).join("");

        const selectedPadding = parseInt(exportPreferences["padding-top"], 10) || 0;
        this.paddings = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72].map(size =>
            `<option value="${size}" ${size === selectedPadding ? "selected" : ""}>${size}px</option>`
        ).join("");

        const selectedFormat = exportPreferences["format"] || "A4";
        this.formats = ["A4", "Letter", "Legal", "Tabloid"].map(format =>
            `<option value="${format}" ${format === selectedFormat ? "selected" : ""}>${format}</option>`
        ).join("");

        const selectedOrientation = exportPreferences["orientation"] || "Portrait";
        this.orientations = ["Portrait", "Landscape"].map(orientation =>
            `<option value="${orientation}" ${orientation === selectedOrientation ? "selected" : ""}>${orientation}</option>`
        ).join("");

        this.selectedColor = exportPreferences["document-font-color"] || "#000000";
    }

    async afterRender() {
        const swatch = this.element.querySelector('#font-color-swatch');
        const hex = this.element.querySelector('#document-font-color');
        const picker = this.element.querySelector('#hidden-font-color');
        swatch.style.backgroundColor = this.selectedColor;
        hex.value = this.selectedColor;

        swatch.addEventListener('click', e => {
            picker.style.left = `${e.clientX}px`;
            picker.style.top = `${e.clientY}px`;
            picker.click();
        });

        picker.addEventListener('input', e => {
            const color = e.target.value;
            swatch.style.backgroundColor = color;
            hex.value = color;
            localStorage.setItem('document-font-color', color);
        });

        hex.addEventListener('input', e => {
            const color = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                swatch.style.backgroundColor = color;
                picker.value = color;
                localStorage.setItem('document-font-color', color);
            }
        });

        this.element.addEventListener("change", (event) => {
            this.element.querySelector('.general-button').classList.remove('disabled');
        });
    }
    getPreferences() {
        const preferences = {
            section: this.element.querySelector("#section").value,
            font: this.element.querySelector("#font").value,
            "font-style": this.element.querySelector("#font-style").value,
            "font-size": this.element.querySelector("#font-size").value,
            "document-font-color": this.element.querySelector("#document-font-color").value,
            position: this.element.querySelector("#position").value,
            style: this.element.querySelector("#style").value,
            "padding-top": this.element.querySelector("#padding-top").value,
            "padding-right": this.element.querySelector("#padding-right").value,
            "padding-bottom": this.element.querySelector("#padding-bottom").value,
            "padding-left": this.element.querySelector("#padding-left").value,
            format: this.element.querySelector("#format").value,
            orientation: this.element.querySelector("#orientation").value,
            "export-document-font-color": this.element.querySelector("#export-document-font-color").value
        };
        return preferences;
    }
    async save(eventTarget) {
        await assistOS.loadifyFunction(async () => {
            const preferences = this.getPreferences();
            await documentModule.updateExportPreferences(assistOS.user.email, preferences);
        })
    }
}