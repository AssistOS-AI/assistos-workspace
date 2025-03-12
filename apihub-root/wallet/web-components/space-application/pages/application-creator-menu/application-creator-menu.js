const actionButton = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="12" cy="6" r="2" fill="#2A92AF"/> <circle cx="12" cy="12" r="2" fill="#2A92AF"/> <circle cx="12" cy="18" r="2" fill="#2A92AF"/> </svg>`

const spaceModule = require('assistos').loadModule('space', {});


const getPageRows = async function (spaceId) {
    return await spaceModule.getWebAssistantConfigurationPages(spaceId);
}

const getMenu = async function (spaceId, pageId) {
    const menu = await spaceModule.getWebAssistantConfigurationPageMenu(spaceId, pageId);
    return menu;
}


const getDropDownMenu = function (id) {
    return `<div class="action-dropdown" id="dropdown-${id}">
            <a href="#" class="dropdown-item" data-local-action="openEditModal ${id}">
              <svg>...</svg>
              Edit
            </a>
            <a href="#" class="dropdown-item" data-local-action="deleteMenuItem ${id}">
              <svg>...</svg>
              Delete
            </a>
          </div>
`
}

export class ApplicationCreatorMenu {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.spaceId = assistOS.space.id;
        this.pageName = "Menu";
        this.invalidate();
    }

    async beforeRender() {
        const pages = await getPageRows(this.spaceId);

        if (!this.currentPage && pages.length > 0) {
            this.currentPage = pages[0].id;
            this.currentPageName = pages[0].name;
            const menu = await getMenu(this.spaceId, this.currentPage);
            this.menuRows = menu.map(menuData => {
                return `<tr>
            <td class="max-icon-display"><img class="menu-item-img" src="${menuData.icon}"></td>
            <td>${menuData.name}</td>
            <td>${this.currentPageName}</td>
            <td class="application-action-button" data-local-action="viewActions ${menuData.id}" ">
          ${actionButton}
         ${getDropDownMenu(menuData.id)}
        </td>
            </tr>`
            }).join('');
            this.pages = pages.map(pageData => {
                return `<option value="${pageData.id}" ${this.currentPage === pageData.id ? "selected" : ""} >${pageData.name}</option>`
            }).join('');
        }else{
            this.disabledAdd = "disabled";
            this.pages= `<option selected>Create A Page First</option>`;
        }



    }

    async afterRender() {
        this.element.querySelector("#selectedPage").addEventListener('change', (event) => {
            this.currentPage = event.target.value;
            this.currentPageName = event.target.options[event.target.selectedIndex].text;
            this.invalidate();
        });
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

    async openEditModal(eventTarget, id) {
        const {shouldInvalidate} = await assistOS.UI.showModal("application-edit-menu-modal", {
            presenter: "application-edit-menu-modal",
            id,
            pageId: this.currentPage
        }, true)
        if (shouldInvalidate) {
            this.invalidate();
        }
    }

    async openAddModal(evenTarget) {
        const {shouldInvalidate} = await assistOS.UI.showModal("application-edit-menu-modal", {
            presenter: "application-edit-menu-modal",
        }, true)
        if (shouldInvalidate) {
            this.invalidate();
        }
    }

    async deleteMenuItem(eventTarget, id) {
        await spaceModule.deleteWebAssistantConfigurationPageMenuItem(this.spaceId, this.currentPage, id);
        this.invalidate();
    }
}