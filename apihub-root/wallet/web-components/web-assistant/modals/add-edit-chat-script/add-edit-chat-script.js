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
        const components = await codeManager.listComponents(this.spaceId);

        if (this.scriptId) {
            this.chatScript = await chatModule.getChatScript(assistOS.space.id, this.scriptId);
            this.modalTitle = 'Edit Script';
        } else {
            this.modalTitle = 'Add Script';
        }
        this.componentOptions = components.map(component => {
            let isChecked =  this.chatScript?.components.find(c => c === component.componentName) ?  "checked" : "";
            return `
                <div class="dropdown-item" data-local-action="toggleCheckbox ${component.componentName}">
                    <input type="checkbox" value="${component.componentName}" data-name="${component.componentName}" data-app-name="${component.appName}" ${isChecked}>
                    <label>${component.componentName}</label>
                    <div class="component-app">${component.appName}</div>
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
        this.componentsContainer = this.element.querySelector('.multi-select-container');
        this.componentList = this.element.querySelector('#component-list');
        this.selectedItems = this.element.querySelector('.selected-items');
        this.selectedComponentPills = this.element.querySelector('#selected-widgets-pills');
        this.selectedComponentsPlaceholder = this.element.querySelector('#selected-widgets-placeholder');

        if (this.chatScript) {
            this.nameInput.value = this.chatScript.name;
            this.codeInput.value = this.chatScript.code || '';
            this.descriptionInput.value = this.chatScript.description || '';
        }
        this.updateSelectedComponents();

        this.boundClickOutside = this.clickOutside.bind(this);
        document.addEventListener('click', this.boundClickOutside);
    }

    afterUnload() {
        document.removeEventListener('click', this.boundClickOutside);
    }

    clickOutside(event) {
        if (!this.componentsContainer.contains(event.target)) {
            this.componentList.classList.remove('open');
            this.selectedItems.classList.remove('open');
        }
    }

    toggleWidgetDropdown() {
        this.componentList.classList.toggle('open');
        this.selectedItems.classList.toggle('open');
    }

    toggleCheckbox(targetElement, widgetId) {
        let checkBox = targetElement.querySelector("input");
        if(checkBox.checked){
            setTimeout(()=>{
                checkBox.checked = true;
            }, 0);
        } else {
            setTimeout(()=>{
                checkBox.checked = false;
            }, 0);
        }
        this.updateSelectedComponents();
    }

    updateSelectedComponents() {
        this.selectedComponentPills.innerHTML = '';
        const selectedCheckboxes = this.componentList.querySelectorAll('input[type="checkbox"]:checked');

        if (selectedCheckboxes.length > 0) {
            this.selectedComponentsPlaceholder.style.display = 'none';
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
                    this.updateSelectedComponents();
                };
                pill.appendChild(removeBtn);
                this.selectedComponentPills.appendChild(pill);
            });
        } else {
            this.selectedComponentsPlaceholder.style.display = 'block';
        }
    }

    closeModal(target) {
        assistOS.UI.closeModal(target);
    }


    async saveScript(target) {
        const name = this.nameInput.value.trim();
        const code = this.codeInput.value.trim();
        const description = this.descriptionInput.value.trim();
        const selectedCheckboxes = this.componentList.querySelectorAll('input[type="checkbox"]:checked');
        let components = [];
        for(let checkBox of selectedCheckboxes){
            let componentName = checkBox.value;
            let appName = checkBox.getAttribute("data-app-name");
            components.push({componentName, appName});
        }
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
                components
            };
            await chatModule.updateChatScript(assistOS.space.id, this.scriptId, script);
        } else {
            await chatModule.createChatScript(assistOS.space.id, name, code, description, components, role);
        }
        assistOS.UI.closeModal(target, true);
    }
}