const codeManager = assistOS.loadModule("codemanager");
const chatModule = assistOS.loadModule("chat");
export class AddEditChatScript {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.spaceId = assistOS.space.id;
        this.scriptId = this.element.getAttribute('data-script-id');
        this.invalidate();
    }

    async beforeRender() {
        const widgets = await codeManager.getWidgets(this.spaceId);

        if (this.scriptId) {
            this.chatScript = await chatModule.getChatScript(assistOS.space.id, this.scriptId);
            this.modalTitle = 'Edit Script';
        } else {
            this.modalTitle = 'Add Script';
        }
        this.widgetOptions = widgets.map(widget => {
            const isChecked = this.chatScript?.widgetIds?.includes(widget.id) ? "checked" : "";
            return `
                <div class="dropdown-item" data-local-action="toggleCheckbox ${widget.id}">
                    <input type="checkbox" id="widget-${widget.id}" value="${widget.id}" data-name="${widget.name}" ${isChecked}>
                    <label for="widget-${widget.id}">${widget.name}</label>
                </div>
            `;
        }).join('');
    }

    async afterRender() {
        this.nameInput = this.element.querySelector('#script-name');
        this.codeInput = this.element.querySelector('#script-code');
        this.descriptionInput = this.element.querySelector('#script-description');
        let roleOptions = [{name: "Guest", value: "guest"},{name: "Member", value: "member"},{name: "Admin", value: "admin"}]
        assistOS.UI.createElement("custom-select", ".select-role-container", {
                options: roleOptions,
            },
            {
                "data-width": "230",
                "data-name": "role",
                "data-selected": this.chatScript?.role,
            })
        this.widgetContainer = this.element.querySelector('.multi-select-container');
        this.widgetList = this.element.querySelector('#widget-list');
        this.selectedItems = this.element.querySelector('.selected-items');
        this.selectedWidgetsPills = this.element.querySelector('#selected-widgets-pills');
        this.selectedWidgetsPlaceholder = this.element.querySelector('#selected-widgets-placeholder');

        if (this.chatScript) {
            this.nameInput.value = this.chatScript.name;
            this.codeInput.value = this.chatScript.code || '';
            this.descriptionInput.value = this.chatScript.description || '';
        }
        this.updateSelectedWidgets();

        this.boundClickOutside = this.clickOutside.bind(this);
        document.addEventListener('click', this.boundClickOutside);
    }

    disconnectedCallback() {
        document.removeEventListener('click', this.boundClickOutside);
    }

    clickOutside(event) {
        if (!this.widgetContainer.contains(event.target)) {
            this.widgetList.classList.remove('open');
            this.selectedItems.classList.remove('open');
        }
    }

    toggleWidgetDropdown() {
        this.widgetList.classList.toggle('open');
        this.selectedItems.classList.toggle('open');
    }

    toggleCheckbox(event, widgetId) {
        const checkbox = this.element.querySelector(`#widget-${widgetId}`);
        if(checkbox){
            // Prevent the click from propagating to the clickOutside listener
            event.stopPropagation();
            // If the click was not on the checkbox itself, toggle it
            if (event.target.tagName !== 'INPUT') {
                checkbox.checked = !checkbox.checked;
            }
            this.updateSelectedWidgets();
        }
    }

    updateSelectedWidgets() {
        this.selectedWidgetsPills.innerHTML = '';
        const selectedCheckboxes = this.widgetList.querySelectorAll('input[type="checkbox"]:checked');

        if (selectedCheckboxes.length > 0) {
            this.selectedWidgetsPlaceholder.style.display = 'none';
            selectedCheckboxes.forEach(checkbox => {
                const pill = document.createElement('div');
                pill.className = 'pill';
                pill.textContent = checkbox.dataset.name;
                const removeBtn = document.createElement('span');
                removeBtn.className = 'remove-pill';
                removeBtn.innerHTML = '&times;';
                removeBtn.onclick = (event) => {
                    event.stopPropagation();
                    checkbox.checked = false;
                    this.updateSelectedWidgets();
                };
                pill.appendChild(removeBtn);
                this.selectedWidgetsPills.appendChild(pill);
            });
        } else {
            this.selectedWidgetsPlaceholder.style.display = 'block';
        }
    }

    closeModal(target) {
        assistOS.UI.closeModal(target);
    }


    async saveScript(target) {
        const name = this.nameInput.value.trim();
        const code = this.codeInput.value.trim();
        const description = this.descriptionInput.value.trim();
        const selectedCheckboxes = this.widgetList.querySelectorAll('input[type="checkbox"]:checked');
        const widgets = Array.from(selectedCheckboxes).map(cb => cb.value);
        let roleSelect = this.element.querySelector(`custom-select[data-name="role"]`);
        let selectedOption = roleSelect.querySelector(`.option[data-selected='true']`);
        let role = selectedOption.getAttribute('data-value');
        if (this.scriptId) {
            const script = {
                id: this.scriptId,
                name,
                code,
                role,
                description,
                widgets
            };
            await chatModule.updateChatScript(assistOS.space.id, this.scriptId, script);
        } else {
            await chatModule.createChatScript(assistOS.space.id, name, code, description, widgets, role);
        }
        assistOS.UI.closeModal(target, true);
    }
}