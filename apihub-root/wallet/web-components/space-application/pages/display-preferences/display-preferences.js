export class DisplayPreferences {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    async beforeRender() {
        const selectedParagraphSize = parseInt(localStorage.getItem("document-font-size"), 10) || 12;
        const selectedFont = localStorage.getItem("document-font-family") || "Arial";
        this.selectedColor = localStorage.getItem("document-font-color") || "#000000";
        const selectedDocumentTitleSize = parseInt(localStorage.getItem("document-title-font-size"), 10) ?? 24;
        const selectedChapterTitleSize = parseInt(localStorage.getItem("chapter-title-font-size"), 10) ?? 20;
        const selectedAbstractSize = parseInt(localStorage.getItem("abstract-font-size"), 10) ?? 14;
        const selectedParagraphIndent = parseInt(localStorage.getItem("document-indent-size"), 10) ?? 12;
        this.docTitleFontSize = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72].map(size => `
                        <option value="${size}" ${size === selectedDocumentTitleSize ? "selected" : ""}>${size}px</option>`).join("");
        this.chapterTitleFontSize = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]
            .map(size => `
                        <option value="${size}" ${size === selectedChapterTitleSize ? "selected" : ""}>${size}px</option>`)
            .join("");
        this.documentInfoFontSize = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]
            .map(size => `
                        <option value="${size}" ${size === selectedAbstractSize ? "selected" : ""}>${size}px</option>`)
            .join("");
        this.documentFontSize = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]
            .map(size => `
                        <option value="${size}" ${size === selectedParagraphSize ? "selected" : ""}>${size}px</option>`).join("");
        this.indentSize = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]
            .map(size => `
                        <option value="${size}" ${size === selectedParagraphIndent ? "selected" : ""}>${size}px</option>`).join("");
        this.fontFamily = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana"]
            .map(font => `
                        <option value="${font}" ${font === selectedFont ? "selected" : ""}>${font}</option>`).join("");
    }
    afterRender(){
        const swatch=this.element.querySelector('#font-color-swatch')
        const hex=this.element.querySelector('#document-font-color')
        const picker=this.element.querySelector('#hidden-font-color')
        swatch.style.backgroundColor=this.selectedColor
        hex.value=this.selectedColor
        swatch.addEventListener('click',e=>{
            picker.style.left=e.clientX+'px'
            picker.style.top=e.clientY+'px'
            picker.click()
        })

        picker.addEventListener('input',e=>{
            const v=e.target.value
            swatch.style.backgroundColor=v
            hex.value=v
            localStorage.setItem('document-font-color',v)
        })
        hex.addEventListener('input',e=>{
            const v=e.target.value
            if(/^#[0-9A-Fa-f]{6}$/.test(v)){
                swatch.style.backgroundColor=v
                picker.value=v
                localStorage.setItem('document-font-color',v)
            }
        })
        this.element.addEventListener("change", (event) => {
            const id = event.target.id;
            if (id === "document-font-size") {
                localStorage.setItem("document-font-size", event.target.value);
            } else if (id === "document-font-family") {
                localStorage.setItem("document-font-family", event.target.value);
            } else if (id === "document-font-color") {
                localStorage.setItem("document-font-color", event.target.value);
            } else if (id === "document-title-font-size") {
                localStorage.setItem("document-title-font-size", event.target.value);
            } else if (id === "document-chapter-title-font-size") {
                localStorage.setItem("chapter-title-font-size", event.target.value);
            } else if (id === "document-abstract-font-size") {
                localStorage.setItem("abstract-font-size", event.target.value);
            } else if (id === "document-indent-size") {
                localStorage.setItem("document-indent-size", event.target.value);
            }
        });
    }
}