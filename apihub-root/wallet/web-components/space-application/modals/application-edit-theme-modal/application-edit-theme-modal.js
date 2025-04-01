const spaceModule = require('assistos').loadModule('space', {});

const themeContract = {
    '--bg': { type: 'color', default: '#ffffff', label: 'Background' },
    '--bg-secondary': { type: 'color', default: '#f5f5f5', label: 'Secondary Background' },

    '--text': { type: 'color', default: '#000000', label: 'Primary Text' },
    '--text-secondary': { type: 'color', default: '#6c757d', label: 'Secondary Text' },

    '--primary': { type: 'color', default: '#007bff', label: 'Primary Color' },
    '--primary-hover': { type: 'color', default: '#0056b3', label: 'Primary Hover' },
    '--accent': { type: 'color', default: '#17a2b8', label: 'Accent Color' },

    '--danger': { type: 'color', default: '#dc3545', label: 'Danger Color' },
    '--success': { type: 'color', default: '#28a745', label: 'Success Color' },
    '--warning': { type: 'color', default: '#ffc107', label: 'Warning Color' },

    '--focus-ring': { type: 'color', default: '#66afe9', label: 'Focus Ring Color' },
    '--disabled-bg': { type: 'color', default: '#e9ecef', label: 'Disabled Background' },
    '--disabled-text': { type: 'color', default: '#adb5bd', label: 'Disabled Text' },
    '--link-color': { type: 'color', default: '#007bff', label: 'Link Color' },
    '--link-hover': { type: 'color', default: '#0056b3', label: 'Link Hover Color' },

    '--font-family': {
        type: 'select',
        options: ['Roboto', 'Inter', 'Arial', 'Georgia'],
        default: 'Roboto',
        label: 'Font Family'
    },

    '--font-size': { type: 'text', default: '16px', label: 'Base Font Size' },
    '--heading-font-size': { type: 'text', default: '24px', label: 'Heading Font Size' },

    '--padding': { type: 'text', default: '16px', label: 'Padding' },
    '--margin': { type: 'text', default: '16px', label: 'Margin' },

    '--border-color': { type: 'color', default: '#dee2e6', label: 'Border Color' },
    '--border-radius': { type: 'text', default: '8px', label: 'Border Radius' },
    '--button-radius': { type: 'text', default: '4px', label: 'Button Radius' },
    '--container-max-width': { type: 'text', default: '1200px', label: 'Container Max Width' },
    '--gap': { type: 'text', default: '1rem', label: 'Grid Gap' }
};


const getThemeData = async function (spaceId, pageId) {
    const theme = await spaceModule.getWebAssistantTheme(spaceId, pageId);
    return theme;
}


export class ApplicationEditThemeModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.id = this.element.getAttribute('data-id');
        this.spaceId = assistOS.space.id;
        this.themeVars = {};
        this.customCSS = '';
        this.modalName = '';
        this.actionButton = '';
        this.actionFn = '';
        this.invalidate();
    }

    async beforeRender() {
        if (this.id) {
            await this.handleEditRender();
        } else {
            await this.handleAddRender();
        }
    }



    async handleAddRender() {
        this.modalName = "Add Theme";
        this.actionButton = "Add";
        this.actionFn = `addPage`;
    }

    async handleEditRender() {
        this.modalName = "Edit Theme";
        this.actionButton = "Save";
        this.actionFn = `editPage`;

        const themeData = await getThemeData(this.spaceId, this.id);
        this.name = themeData.name;
        this.description = themeData.description;
        this.themeVars = themeData.themeVars;
        this.customCSS = themeData.customCSS;
    }

    async afterRender() {
        this.renderThemeVarControls();
        this.element.querySelector('#custom-css').value = this.customCSS;
        this.form = this.element.querySelector('.application-form');
    }

    renderThemeVarControls() {
        const container = this.element.querySelector('.theme-vars-container');
        container.innerHTML = '';

        Object.entries(themeContract).forEach(([key, config]) => {
            const value = this.themeVars[key] ?? config.default ?? '';
            const wrapper = document.createElement('div');
            wrapper.className = 'theme-var-item';

            const label = document.createElement('label');
            label.textContent = key;
            wrapper.appendChild(label);

            let input;
            if (config.type === 'color' || config.type === 'text') {
                input = document.createElement('input');
                input.type = config.type;
                input.name = key;
                input.value = value;
            } else if (config.type === 'select') {
                input = document.createElement('select');
                input.name = key;
                config.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    if (opt === value) option.selected = true;
                    input.appendChild(option);
                });
            }

            wrapper.appendChild(input);
            container.appendChild(wrapper);
        });
    }


    async closeModal() {
        await assistOS.UI.closeModal(this.element, { shouldInvalidate: true });
    }

    async addPage() {
        await this.saveTheme('add');
    }

    async editPage() {
        await this.saveTheme('edit');
    }

    async saveTheme(mode) {
        const formData = await assistOS.UI.extractFormInformation(this.form);
        if (formData.isValid) {
            const themeInputs = this.element.querySelectorAll('.theme-vars-container [name]');
            const descriptionElement = this.element.querySelector('#description');
            const description =  descriptionElement.value;
            const themeVars = {};
            themeInputs.forEach(input => themeVars[input.name] = input.value);
            const themeData = {
                name: formData.data["theme-name"],
                description,
                themeVars,
                customCSS: this.element.querySelector('#custom-css').value
            };
            if (mode === 'add') {
                await spaceModule.addWebAssistantTheme(this.spaceId, themeData);
            } else {
                await spaceModule.updateWebAssistantTheme(this.spaceId, this.id, themeData);
            }

            await this.closeModal();
        }
    }
}