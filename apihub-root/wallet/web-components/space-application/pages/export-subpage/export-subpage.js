export class ExportSubpage {
    constructor(element, invalidate) {
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    async beforeRender() {
        const selectedSection = localStorage.getItem("section") || "Header";
        this.sections = ["Header", "Footer", "Body"].map(section =>
            `<option value="${section}" ${section === selectedSection ? "selected" : ""}>${section}</option>`
        ).join("");

        const selectedFont = localStorage.getItem("font") || "Arial";
        this.fonts = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana"].map(font =>
            `<option value="${font}" ${font === selectedFont ? "selected" : ""}>${font}</option>`
        ).join("");

        const selectedFontStyle = localStorage.getItem("font-style") || "Normal";
        this.fontStyles = ["Normal", "Italic", "Bold", "Bold Italic"].map(style =>
            `<option value="${style}" ${style === selectedFontStyle ? "selected" : ""}>${style}</option>`
        ).join("");

        const selectedFontSize = parseInt(localStorage.getItem("font-size"), 10) || 12;
        this.fontSizes = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72].map(size =>
            `<option value="${size}" ${size === selectedFontSize ? "selected" : ""}>${size}px</option>`
        ).join("");

        const selectedPosition = localStorage.getItem("position") || "Left";
        this.positions = ["Left", "Center", "Right", "Top", "Bottom"].map(pos =>
            `<option value="${pos}" ${pos === selectedPosition ? "selected" : ""}>${pos}</option>`
        ).join("");

        const selectedStyle = localStorage.getItem("style") || "Default";
        this.styles = ["Default", "Simple", "Fancy"].map(style =>
            `<option value="${style}" ${style === selectedStyle ? "selected" : ""}>${style}</option>`
        ).join("");

        const selectedPadding = parseInt(localStorage.getItem("padding-top"), 10) || 0;
        this.paddings = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72].map(size =>
            `<option value="${size}" ${size === selectedPadding ? "selected" : ""}>${size}px</option>`
        ).join("");

        const selectedFormat = localStorage.getItem("format") || "A4";
        this.formats = ["A4", "Letter", "Legal", "Tabloid"].map(format =>
            `<option value="${format}" ${format === selectedFormat ? "selected" : ""}>${format}</option>`
        ).join("");

        const selectedOrientation = localStorage.getItem("orientation") || "Portrait";
        this.orientations = ["Portrait", "Landscape"].map(orientation =>
            `<option value="${orientation}" ${orientation === selectedOrientation ? "selected" : ""}>${orientation}</option>`
        ).join("");

        this.selectedColor = localStorage.getItem("document-font-color") || "#000000";
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
            const id = event.target.id;
            localStorage.setItem(id, event.target.value);
            document.querySelector('document-view-page').webSkelPresenter.invalidate();
        });
    }
}