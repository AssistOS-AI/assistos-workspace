const spaceModule = assistOS.loadModule("space");
const llmModule = assistOS.loadModule('llm');

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



export class GenerateThemeModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.spaceId = assistOS.space.id;
        this.invalidate();
    }

    async beforeRender() {
        this.modalName = "Generate Theme";
        this.actionButton = "Generate";
        this.actionFn = `generateTheme`;
    }

    async afterRender() {
        this.form = this.element.querySelector('.application-form');
        this.nameField= this.element.querySelector('#theme-name');
        this.descriptionField = this.element.querySelector('#description');

    }

    async generateTheme(eventTarget) {
    await assistOS.loadifyComponent(this.element, async function(){
        const generateThemePrompt = `
            **Role**: You are tasked with generating a CSS theme based on the provided requirements and a theme contract. You must return a JSON object with an array ob objects. Do NOT include any syntax highlighting, backticks, comments, or extra text—only valid JSON.
            
            **Theme Name**: ${this.nameField.value || 'Untitled'}
            **Theme Description**: ${this.descriptionField.value}
            
            **Instructions**:
            - Use the name and description to guide the theme's visual style.
            - You can be as detailed, comprehensive, creative as you like, but stick to the theme contract and esure the themese is visually appealing, readable, and usable and modern.
            - Implement all variables from the theme contract with appropriate values.
       
            **Theme Contract (variables to implement)**: ${Object.keys(themeContract).join(', ')}
            
            **Output Format**:
            Return a **valid JSON object** with the following structure:
            
            {
                "<variableName1>": "<value1>",
                "<variableName2>": "<value2>"
              
            }
`
        const llmResponse = await llmModule.generateText(this.spaceId, generateThemePrompt)
        const variables = JSON.parse(llmResponse.message);

        const themeData = {
            name:this.nameField.value||'Untitled',
            description:this.descriptionField.value,
            themeVars:{...variables},
            customCSS: ''
        };

        await this.saveTheme(themeData);

    }.bind(this));
    }

    async closeModal() {
        await assistOS.UI.closeModal(this.element, {shouldInvalidate: true});
    }

    async saveTheme(themeData) {
        await spaceModule.addWebAssistantTheme(this.spaceId, themeData);
        await this.closeModal({shouldInvalidate: true});
    }
}