const WebAssistant = assistOS.loadModule("webassistant",{});

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
    const theme = await WebAssistant.getWebChatTheme(spaceId, pageId);
    return theme;
}

export class EditThemeModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.id = this.element.getAttribute('data-id');
        this.spaceId = assistOS.space.id;
        this.assistantId = assistOS.space.webAssistant;
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

        const themeData = await WebAssistant.getTheme(this.spaceId, this.assistantId , this.id);
        this.name = themeData.name;
        this.description = themeData.description;
        this.themeVars = themeData.variables;
        this.customCSS = themeData.css;
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
            label.className = 'theme-var-label';
            label.textContent = `${config.label} (${key})`;
            label.title = key;
            wrapper.appendChild(label);

            if (config.type === 'color') {
                const colorPicker = document.createElement('div');
                colorPicker.className = 'color-picker';
                colorPicker.innerHTML = `
                <div class="color-swatch" style="background-color: ${value};"></div>
               <input type="text" name="${key}" value="${value}" maxlength="7">
                <input type="color" value="${value}" style="display:none">
                <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M14.806 0.732383C15.0368 0.964535 15.2198 1.24015 15.3447 1.54349C15.4696 1.84683 15.5339 2.17196 15.5339 2.5003C15.5339 2.82864 15.4696 3.15376 15.3447 3.45711C15.2198 3.76045 15.0368 4.03606 14.806 4.26822L13.5364 5.54572C13.7587 6.01115 13.8319 6.5346 13.7456 7.04367C13.6594 7.55275 13.4182 8.0223 13.0552 8.38738L12.463 8.98238C12.1524 9.29484 11.7312 9.47036 11.2919 9.47036C10.8527 9.47036 10.4315 9.29484 10.1208 8.98238L4.7499 14.3865C4.51914 14.6188 4.24515 14.803 3.9436 14.9287C3.64205 15.0544 3.31884 15.1191 2.99244 15.119H1.50166C1.23808 15.119 0.985288 15.0137 0.798905 14.8262C0.612522 14.6386 0.507812 14.3843 0.507812 14.1191V12.619C0.507882 12.2906 0.572285 11.9653 0.697341 11.6619C0.822397 11.3585 1.00565 11.0828 1.23664 10.8507L6.60675 5.44655C6.29622 5.134 6.12177 4.71016 6.12177 4.26822C6.12177 3.82628 6.29622 3.40243 6.60675 3.08988L7.19809 2.49488C7.56084 2.12952 8.02745 1.88659 8.5334 1.79971C9.03935 1.71282 9.55963 1.78626 10.0223 2.00988L11.2919 0.732383C11.5227 0.500191 11.7966 0.316005 12.0981 0.190342C12.3995 0.0646784 12.7227 0 13.049 0C13.3753 0 13.6984 0.0646784 13.9999 0.190342C14.3014 0.316005 14.5753 0.500191 14.806 0.732383ZM7.77866 6.62488L2.4069 12.0299L2.33484 12.1124C2.22418 12.2578 2.16422 12.4359 2.16423 12.619V13.4524H2.99244L3.10176 13.4449C3.28202 13.4207 3.44937 13.3376 3.57799 13.2082L8.94975 7.80405L7.77866 6.62488ZM13.6341 1.91072C13.4788 1.75449 13.2682 1.66673 13.0486 1.66673C12.8289 1.66673 12.6183 1.75449 12.463 1.91072L10.7122 3.67322C10.5553 3.83097 10.3426 3.91959 10.1208 3.91959C9.89906 3.91959 9.68636 3.83097 9.5295 3.67322C9.37574 3.51852 9.1672 3.43161 8.94975 3.43161C8.73231 3.43161 8.52377 3.51852 8.37001 3.67322L7.77866 4.26822L11.2919 7.80405L11.8833 7.20822C12.037 7.0535 12.1234 6.84367 12.1234 6.62488C12.1234 6.40609 12.037 6.19626 11.8833 6.04155C11.7265 5.88372 11.6384 5.6697 11.6384 5.44655C11.6384 5.2234 11.7265 5.00938 11.8833 4.85155L13.6349 3.08988C13.7119 3.01249 13.773 2.92058 13.8147 2.81942C13.8564 2.71825 13.8778 2.60981 13.8778 2.5003C13.8778 2.39079 13.8564 2.28235 13.8147 2.18118C13.773 2.08002 13.7111 1.98811 13.6341 1.91072Z" fill="#505050"></path>
                </svg> 
                
            `;
                wrapper.appendChild(colorPicker);

                const swatch = colorPicker.querySelector('.color-swatch');
                const textInput = colorPicker.querySelector('input[type="text"]');
                const hiddenInput = colorPicker.querySelector('input[type="color"]');

                colorPicker.addEventListener('click', () => {
                    hiddenInput.click();
                });

                hiddenInput.addEventListener('change', (e) => {
                    const newColor = e.target.value;
                    textInput.value = newColor;
                    swatch.style.backgroundColor = newColor;
                });

                textInput.addEventListener('change', (e) => {
                    const newColor = e.target.value;
                    swatch.style.backgroundColor = newColor;
                    hiddenInput.value = newColor;
                });

            } else if (config.type === 'text') {
                const input = document.createElement('input');
                input.type = 'text';
                input.name = key;
                input.value = value;
                input.className = 'form-input';
                wrapper.appendChild(input);

            } else if (config.type === 'select') {
                const select = document.createElement('select');
                select.name = key;
                select.className = 'form-input';
                config.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    if (opt === value) option.selected = true;
                    select.appendChild(option);
                });
                wrapper.appendChild(select);
            }

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
                variables:themeVars,
                css: this.element.querySelector('#custom-css').value
            };
            if (mode === 'add') {
                await WebAssistant.addTheme(this.spaceId, this.assistantId , themeData);
            } else {
                await WebAssistant.updateTheme(this.spaceId, this.assistantId , this.id, themeData);
            }
            await this.closeModal();
        }
    }
}