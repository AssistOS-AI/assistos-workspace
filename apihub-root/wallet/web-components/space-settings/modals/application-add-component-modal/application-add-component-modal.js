const WebAssistant = assistOS.loadModule("webassistant", {});

export class ApplicationAddComponentModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.title = "Add New Component";
    }

    closeModal() {
        assistOS.UI.closeModal(this.element);
    }

    kebabToPascalCase(str) {
        return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    }

    async submitForm() {
        const form = this.element.querySelector("#component-form");
        const formData = await assistOS.UI.extractFormInformation(form);
        if (formData.isValid) {
            const name = formData.data.name;
            const type = formData.data.type;
            const presenterClassName = this.kebabToPascalCase(name);

            const componentData = {
                name: name,
                type: type,
                directory: name,
                presenterClassName: presenterClassName,
                html: `<!-- HTML for ${name} -->\n<div class="${name}">\n    New ${name} component\n</div>`,
                css: `/* CSS for ${name} */\n.${name} {\n\n}`,
                js: `export class ${presenterClassName} {\n    constructor(element, invalidate) {\n        this.element = element;\n        this.invalidate = invalidate;\n        this.invalidate();\n    }\n\n    beforeRender() {\n\n    }\n\n    afterRender() {\n\n    }\n}`
            };
            await WebAssistant.addWebskelComponent(assistOS.space.id,componentData);
            assistOS.UI.closeModal(this.element, { added: true });
        }
    }
}
