const actionButton = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="12" cy="6" r="2" fill="#2A92AF"/> <circle cx="12" cy="12" r="2" fill="#2A92AF"/> <circle cx="12" cy="18" r="2" fill="#2A92AF"/> </svg>`

const getDropDownMenu = function (id) {
    return `<div class="action-dropdown" id="dropdown-${id}">
            <a href="#" class="dropdown-item" data-local-action="openEditModal ${id}">
              <svg>...</svg>
              Edit
            </a>
            <a href="#" class="dropdown-item" data-local-action="deletePage ${id}">
              <svg>...</svg>
              Delete
            </a>
          </div>
`
}
const spaceModule = require('assistos').loadModule('space', {});

const getPageRows = async function (spaceId) {
    return await spaceModule.getWebAssistantConfigurationPages(spaceId);
}

export class ApplicationCreatorPages {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.spaceId = assistOS.space.id;
        this.pageName = "Pages"
        this.invalidate();
    }

    async beforeRender() {
        this.pageRows = (await getPageRows(this.spaceId)).map(pageData => {
            return `<tr>
            <td>${pageData.name}</td>
            <td>${pageData.widget}</td>
            <td>${pageData.description}</td>
            <td class="application-action-button" data-local-action="viewActions ${pageData.id}" ">
          ${actionButton}
         ${getDropDownMenu(pageData.id)}
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

    async openAddModal(evenTarget) {
        const {shouldInvalidate} = await assistOS.UI.showModal("application-edit-page-modal", {
            presenter: "application-edit-page-modal",
        }, true)
        if (shouldInvalidate) {
            this.invalidate();
        }
    }

    async openEditModal(evenTarget,id) {
        const {shouldInvalidate} = await assistOS.UI.showModal("application-edit-page-modal", {
            presenter: "application-edit-page-modal",
            id
        }, true)
        if (shouldInvalidate) {
            this.invalidate();
        }
    }

    async deletePage(evenTarget,id) {
            await spaceModule.deleteWebAssistantConfigurationPage(this.spaceId,id);
            this.invalidate();
    }
}