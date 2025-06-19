const documentModule = assistOS.loadModule("document");

export class StyleSubpage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    async beforeRender() {
        const stylePreferences = await documentModule.getStylePreferences(assistOS.user.email);
        this.selectedColor = stylePreferences["document-font-color"] || "#000000";
    }
    getSelectOptionPX(sizes) {
        return sizes.map(size => ({
            name: size + 'px',
            value: size
        }));
    }
    getSelectedOptionValue(styleName, defaultValue){
        if(this.stylePreferences[styleName]){
            return parseInt(this.stylePreferences[styleName], 10);
        }
        return defaultValue;
    }
    renderPXSizeSelect(numbers, elementId, defaultValue) {
        let options = this.getSelectOptionPX(numbers);
        const selected = this.getSelectedOptionValue(elementId, defaultValue);
        assistOS.UI.createElement("custom-select", `#${elementId}`, {
                options: options,
            },
            {
                "data-name": elementId,
                "data-selected": selected,
            });
    }

    async afterRender() {
        this.stylePreferences = await documentModule.getStylePreferences(assistOS.user.email);
        let fontSizes = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72];
        this.renderPXSizeSelect(fontSizes, "document-title-font-size", 24);
        this.renderPXSizeSelect(fontSizes, "chapter-title-font-size", 20);
        this.renderPXSizeSelect(fontSizes, "document-font-size", 12);
        
        let indentSize = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72];
        this.renderPXSizeSelect(indentSize, "document-indent-size", 12);

        let fontFamily = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana"];
        let options = fontFamily.map(font => ({
            name: font,
            value: font
        }));
        const selected = this.stylePreferences["document-font-family"] || "Arial";
        assistOS.UI.createElement("custom-select", `#document-font-family`, {
                options: options,
            },
            {
                "data-name": "document-font-family",
                "data-selected": selected,
            });

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
            "document-title-font-size": parseInt(this.element.querySelector(`custom-select[data-name="document-title-font-size"]`).value, 10),
            "chapter-title-font-size": parseInt(this.element.querySelector(`custom-select[data-name="chapter-title-font-size"]`).value, 10),
            "document-font-size": parseInt(this.element.querySelector(`custom-select[data-name="document-font-size"]`).value, 10),
            "document-indent-size": parseInt(this.element.querySelector(`custom-select[data-name="document-indent-size"]`).value, 10),
            "document-font-family": this.element.querySelector(`custom-select[data-name="document-font-family"]`).value,
            "document-font-color": this.element.querySelector("#document-font-color").value
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