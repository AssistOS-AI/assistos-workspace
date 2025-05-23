const documentModule = assistOS.loadModule("document");

export class StyleSubpage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    async beforeRender() {
        const stylePreferences = await documentModule.getStylePreferences(assistOS.user.email);
        const selectedParagraphSize = parseInt(stylePreferences["document-font-size"], 10) || 12;
        const selectedFont = stylePreferences["document-font-family"] || "Arial";
        this.selectedColor = stylePreferences["document-font-color"] || "#000000";
        const selectedDocumentTitleSize = parseInt(stylePreferences["document-title-font-size"], 10) ?? 24;
        const selectedChapterTitleSize = parseInt(stylePreferences["chapter-title-font-size"], 10) ?? 20;
        const selectedParagraphIndent = parseInt(stylePreferences["document-indent-size"], 10) ?? 12;
        this.docTitleFontSize = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72].map(size => `
                        <option value="${size}" ${size === selectedDocumentTitleSize ? "selected" : ""}>${size}px</option>`).join("");
        this.chapterTitleFontSize = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]
            .map(size => `
                        <option value="${size}" ${size === selectedChapterTitleSize ? "selected" : ""}>${size}px</option>`)
            .join("");
        this.documentFontSize = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]
            .map(size => `
                        <option value="${size}" ${size === selectedParagraphSize ? "selected" : ""}>${size}px</option>`).join("");
        this.indentSize = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]
            .map(size => `
                        <option value="${size}" ${size === selectedParagraphIndent ? "selected" : ""}>${size}px</option>`).join("");
        this.fontFamily = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana"]
            .map(font => `<option value="${font}" ${font === selectedFont ? "selected" : ""}>${font}</option>`).join("");
    }

    async afterRender() {
        const swatch = this.element.querySelector('#font-color-swatch')
        const hex = this.element.querySelector('#document-font-color')
        const picker = this.element.querySelector('#hidden-font-color')
        swatch.style.backgroundColor = this.selectedColor
        hex.value = this.selectedColor
        swatch.addEventListener('click', e => {
            picker.style.left = e.clientX + 'px'
            picker.style.top = e.clientY + 'px'
            picker.click()
        })
        picker.addEventListener('input', e => {
            const v = e.target.value
            swatch.style.backgroundColor = v
            hex.value = v
            localStorage.setItem('document-font-color', v)
        })
        hex.addEventListener('input', e => {
            const v = e.target.value
            if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
                swatch.style.backgroundColor = v
                picker.value = v
                localStorage.setItem('document-font-color', v)
            }
        })
        this.element.addEventListener("change", (event) => {
            window.assistOS.stylePreferenceCache = this.getPreferences();
            document.querySelector('document-view-page').webSkelPresenter.invalidate();
            this.element.querySelector('.general-button').classList.remove('disabled');
        });
    }

    getPreferences() {
        const preferences = {
            "document-font-size": parseInt(this.element.querySelector("#document-font-size").value, 10),
            "document-font-family": this.element.querySelector("#document-font-family").value,
            "document-font-color": this.element.querySelector("#document-font-color").value,
            "document-title-font-size": parseInt(this.element.querySelector("#document-title-font-size").value, 10),
            "chapter-title-font-size": parseInt(this.element.querySelector("#document-chapter-title-font-size").value, 10),
            "document-indent-size": parseInt(this.element.querySelector("#document-indent-size").value, 10)
        }
        return preferences;
    }

    async save(eventTarget) {
        await assistOS.loadifyFunction(async () => {
            const preferences = this.getPreferences();
            await documentModule.updateDocumentPreferences(assistOS.user.email, preferences);
        })
    }

    async afterUnload() {
        delete window.assistOS.stylePreferenceCache;
    }
}