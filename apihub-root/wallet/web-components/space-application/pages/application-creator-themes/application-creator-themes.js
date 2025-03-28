const spaceModule = require('assistos').loadModule('space', {});
const actionButton = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="12" cy="6" r="2" fill="#2A92AF"/> <circle cx="12" cy="12" r="2" fill="#2A92AF"/> <circle cx="12" cy="18" r="2" fill="#2A92AF"/> </svg>`

const getDropDownMenu = function (id) {
    return `<div class="action-dropdown" id="dropdown-${id}">
            <a href="#" class="dropdown-item" data-local-action="openEditModal ${id}">
              <svg>...</svg>
              Edit
            </a>
            <a href="#" class="dropdown-item" data-local-action="deleteTheme ${id}">
              <svg>...</svg>
              Delete
            </a>
          </div>
`}

const getThemes = async function (spaceId){
    const themes = await spaceModule.getWebAssistantThemes(spaceId);
    return themes;
}

export class ApplicationCreatorThemes {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.pageName = "Themes"
        this.spaceId = assistOS.space.id;
        this.invalidate();
    }

    async beforeRender() {
        this.themeRows= (await getThemes(this.spaceId)).map(themeData => {
            return `<tr>
            <td>${themeData.name}</td>
            <td>${themeData.description}</td>
            <td class="application-action-button" data-local-action="viewActions ${themeData.id}">
          ${actionButton}
         ${getDropDownMenu(themeData.id)}
        </td>
            </tr>`
        }).join('');
    }

    async afterRender() {

    }

    async viewActions(eventTarget, id) {
        document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('show'));

        const dropdown = eventTarget.querySelector('.action-dropdown');
        dropdown.classList.toggle('show');

        const clickHandler = (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
                document.removeEventListener('click', clickHandler);
            }
        };

        document.addEventListener('click', clickHandler);
    }

    async openAddModal(target) {
        const {shouldInvalidate} = await assistOS.UI.showModal("application-edit-theme-modal", {
            presenter: "application-edit-theme-modal",
        }, true)
        if (shouldInvalidate) {
            this.invalidate();
        }
    }
    async openEditModal(target,id) {
        const {shouldInvalidate} = await assistOS.UI.showModal("application-edit-theme-modal", {
            presenter: "application-edit-theme-modal",
            id
        }, true)
        if (shouldInvalidate) {
            this.invalidate();
        }
    }
    async deleteTheme(target,id) {
        await spaceModule.deleteWebAssistantTheme(this.spaceId, id);
        this.invalidate();
    }
}