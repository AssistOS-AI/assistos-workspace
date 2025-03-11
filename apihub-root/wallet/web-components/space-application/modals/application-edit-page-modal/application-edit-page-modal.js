const getPageData = async (id) => {
    return {
        name: "Page Name",
        widgetName: "Widget Name",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        data: "Lorem ipsum dolor sit amet, consectetur adipiscing elit"
    }
}
const getWidgets = async () => {
    return [
        {name: "Widget Name 1"},
        {name: "Widget Name 2"},
        {name: "Widget Name 3"},
        {name: "Widget Name 4"},
        {name: "Widget Name 5"},
        {name: "Widget Name 6"},
        {name: "Widget Name 7"}
    ]
}

export class ApplicationEditPageModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.id = this.element.getAttribute('data-id');
        this.dataStructure = {};
    }

    async beforeRender() {
        if (this.id) {
            await this.handleEditRender();
        } else {
            await this.handleAddRender();
        }
        this.widgets = `<select class="application-form-item-select" name="selectedPage" id="selectedPage">${(await getWidgets()).map(widget => {
            return `<option value="${widget.name}">${widget.name}</option>`
        }).join('')}</select>`
    }

    async handleAddRender() {
        this.modalName = "Add Page";
        this.actionButton = "Add";
        this.actionFn = `addPage`;
        this.disabled = '';
    }

    async handleEditRender() {
        const pageData = await getPageData(this.id);
        this.description = pageData.description;
        this.widgetName = pageData.widgetName;
        this.name = pageData.name;
        this.data = pageData.data;
        this.modalName = "Edit Page";
        this.actionButton = "Save";
        this.actionFn = `editPage`;
        this.widgets = `<input type="text" class="application-form-item-input" id="selectedPage" name="selectedPage" value="${pageData.widgetName}">`
        this.disabled = 'disabled';
    }

    async afterRender() {
        this.tabContent = '';
        this.setupDataTabs();
    }


    setupDataTabs() {
        const container = this.element.querySelector('.data-tabs-container');
        if (!container) return;

        try {
            this.dataStructure = JSON.parse(this.data);
            // Ensure required tabs exist
            if (!this.dataStructure["General Settings"]) {
                this.dataStructure["General Settings"] = { value: '' };
            }
            if (!this.dataStructure["Data"]) {
                this.dataStructure["Data"] = { value: '' };
            }
        } catch (e) {
            this.dataStructure = {
                "General Settings": { value: '' },
                "Data": { value: '' }
            };
        }

        container.addEventListener('input', (e) => {
            if (e.target.tagName === 'TEXTAREA') {
                const activeKey = this.getActiveTabKey();
                if (activeKey) {
                    this.dataStructure[activeKey].value = e.target.value;
                }
            }
        });

        this.renderTabs();
        this.switchTab("General Settings");
    }

    handleDataTypeChange(e) {
        if (e.target.classList.contains('data-type-select')) {
            const activeKey = this.getActiveTabKey();
            if (activeKey) {
                this.dataStructure[activeKey].type = e.target.value;
            }
        }
    }

    handleDataContentInput(e) {
        if (e.target.classList.contains('application-form-item-select') && e.target.tagName === 'TEXTAREA') {
            const activeKey = this.getActiveTabKey();
            if (activeKey) {
                this.dataStructure[activeKey].value = e.target.value;
            }
        }
    }

    getActiveTabKey() {
        const tabsList = this.element.querySelector('.tabs-list');
        return tabsList?.querySelector('.tab.active')?.dataset.key;
    }

    renderTabs() {
        const tabContent = this.element.querySelector('.tab-content');
        if (!tabContent) return;

        tabContent.innerHTML = `
            <textarea class="application-form-item-select no-resize textarea-large" 
                      placeholder="Enter data..."></textarea>
        `;

        // Set up tab click handlers
        this.element.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.element.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.switchTab(tab.dataset.key);
            });
        });
    }



    updateTabContent(key) {
        const tabContent = this.element.querySelector('.tab-content');
        if (!tabContent) return;

        const typeSelect = tabContent.querySelector('.data-type-select');
        const contentArea = tabContent.querySelector('textarea');

        if (typeSelect && contentArea) {
            typeSelect.value = this.dataStructure[key].type;
            contentArea.value = this.dataStructure[key].value;
        }
    }


    switchTab(key) {
        const tabContent = this.element.querySelector('.tab-content');
        if (!tabContent) return;

        const textarea = tabContent.querySelector('textarea');
        if (textarea) {
            textarea.value = this.dataStructure[key]?.value || '';
        }
    }

    async closeModal() {
        await assistOS.UI.closeModal(this.element, {shouldInvalidate: this.shouldInvalidate});
    }

    async addPage() {
        console.log('addPage', this.dataStructure);
        await this.closeModal();
    }

    async editPage() {
        console.log('editPage', this.dataStructure);
        await this.closeModal();
    }
}