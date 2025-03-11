const actionButton = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="12" cy="6" r="2" fill="#2A92AF"/> <circle cx="12" cy="12" r="2" fill="#2A92AF"/> <circle cx="12" cy="18" r="2" fill="#2A92AF"/> </svg>`


const mockMenu = [
    {
        id: 1,
        name: "Home",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
      <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
    </svg>`,
        widgetName: "Header",
        description: "Main landing page"
    },
    {
        id: 2,
        name: "About Us",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
    </svg>`,
        widgetName: "InfoBox",
        description: "Company information"
    },
    {
        id: 3,
        name: "Services",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fill-rule="evenodd" d="M12 6.75a5.25 5.25 0 016.775-5.025.75.75 0 01.313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.64l3.318-3.319a.75.75 0 011.248.313 5.25 5.25 0 01-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 112.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0112 6.75zM4.117 19.125a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008z" clip-rule="evenodd" />
    </svg>`,
        widgetName: "ServiceList",
        description: "List of services offered"
    },
    {
        id: 4,
        name: "Contact",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
    </svg>`,
        widgetName: "Form",
        description: "Contact form page"
    },
    {
        id: 5,
        name: "Blog",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
    </svg>`,
        widgetName: "PostList",
        description: "Latest news and articles"
    },
];

const mockPages = [
    {id: 1, name: "Home", widgetName: "Header", description: "Main landing page"},
    {id: 2, name: "About Us", widgetName: "InfoBox", description: "Company information"},
    {id: 3, name: "Services", widgetName: "ServiceList", description: "List of services offered"},
    {id: 4, name: "Contact", widgetName: "Form", description: "Contact form page"},
    {id: 5, name: "Blog", widgetName: "PostList", description: "Latest news and articles"},
    {id: 6, name: "FAQ", widgetName: "Accordion", description: "Frequently asked questions"},
    {id: 7, name: "Careers", widgetName: "JobList", description: "Current job openings"},
    {id: 8, name: "Testimonials", widgetName: "Carousel", description: "Customer feedback"},
    {id: 9, name: "Portfolio", widgetName: "Gallery", description: "Showcase of past projects"},
    {id: 10, name: "Team", widgetName: "TeamGrid", description: "Meet our team members"},
    {id: 11, name: "Pricing", widgetName: "PriceTable", description: "Available pricing plans"},
    {id: 12, name: "Terms of Service", widgetName: "TextPage", description: "Legal terms and policies"},
    {id: 13, name: "Privacy Policy", widgetName: "TextPage", description: "Data protection and privacy"},
    {id: 14, name: "Partners", widgetName: "LogoGrid", description: "Our trusted partners"},
    {id: 15, name: "Support", widgetName: "SupportForm", description: "Customer support page"},
    {id: 16, name: "Events", widgetName: "EventList", description: "Upcoming events and webinars"},
    {id: 17, name: "Press", widgetName: "NewsFeed", description: "Media coverage and press releases"},
    {id: 18, name: "Case Studies", widgetName: "CaseGrid", description: "Detailed project studies"},
    {id: 19, name: "Gallery", widgetName: "ImageGallery", description: "Collection of company photos"},
    {id: 20, name: "E-books", widgetName: "DownloadList", description: "Free resources and e-books"},
    {id: 21, name: "Webinars", widgetName: "VideoList", description: "On-demand training sessions"},
    {id: 22, name: "Community", widgetName: "Forum", description: "User discussions and topics"},
    {id: 23, name: "Courses", widgetName: "CourseList", description: "Educational courses and materials"},
    {id: 24, name: "API Documentation", widgetName: "DocsViewer", description: "Technical API guides"},
    {id: 25, name: "Help Center", widgetName: "HelpArticles", description: "Knowledge base articles"},
    {id: 26, name: "Dashboard", widgetName: "AdminPanel", description: "User analytics and metrics"},
    {id: 27, name: "Reports", widgetName: "ReportList", description: "Data insights and reports"},
    {id: 28, name: "Resources", widgetName: "ResourceList", description: "Guides and useful materials"},
    {id: 29, name: "Security", widgetName: "SecurityInfo", description: "Security policies and best practices"},
    {id: 30, name: "Login", widgetName: "AuthForm", description: "User authentication page"},
    {id: 31, name: "Sign Up", widgetName: "AuthForm", description: "Create a new account"},
    {id: 32, name: "User Profile", widgetName: "ProfilePage", description: "User account settings"},
    {id: 33, name: "Notifications", widgetName: "NotificationList", description: "User alerts and messages"},
    {id: 34, name: "Saved Items", widgetName: "FavoritesList", description: "User saved content"},
    {id: 35, name: "Activity Log", widgetName: "ActivityFeed", description: "Recent user activity"},
    {id: 36, name: "Store", widgetName: "ProductList", description: "E-commerce product catalog"},
    {id: 37, name: "Cart", widgetName: "CartView", description: "Shopping cart and checkout"},
    {id: 38, name: "Wishlist", widgetName: "WishlistView", description: "Saved products for later"},
    {id: 39, name: "Orders", widgetName: "OrderHistory", description: "Purchase history and details"},
    {id: 40, name: "Downloads", widgetName: "DownloadCenter", description: "Digital product downloads"},
    {id: 41, name: "Billing", widgetName: "BillingDetails", description: "Payment and invoice details"},
    {id: 42, name: "Integrations", widgetName: "IntegrationList", description: "Third-party app connections"},
    {id: 43, name: "Legal", widgetName: "LegalDocs", description: "Terms, policies, and agreements"},
    {id: 44, name: "Sitemap", widgetName: "SiteMap", description: "Website structure overview"},
    {id: 45, name: "Maintenance", widgetName: "MaintenanceMode", description: "Temporary downtime notice"},
    {id: 46, name: "Changelog", widgetName: "UpdateLog", description: "Recent updates and fixes"},
    {id: 47, name: "Beta Features", widgetName: "BetaAccess", description: "Experimental new features"},
    {id: 48, name: "Affiliates", widgetName: "AffiliateProgram", description: "Referral program information"},
    {id: 49, name: "Survey", widgetName: "SurveyForm", description: "User feedback collection"},
    {id: 50, name: "Announcements", widgetName: "AnnouncementFeed", description: "Latest company updates"}
];

const getPageRows = async function () {
    return mockPages;
}
const getMenuRows = async function () {
    const random = Math.ceil(Math.random() *mockMenu.length);
    return mockMenu.slice(0,random);
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
        this.pageName = "Menu"
        this.invalidate();
    }

    async beforeRender() {
        if (!this.currentPage) {
            this.currentPage = mockPages[0].name;
        }
        this.pages = (await getPageRows()).map(pageData => {
            return `<option value="${pageData.name}" ${this.currentPage === pageData.name ? "selected" : ""} >${pageData.name}</option>`
        }).join('');
        this.menuRows = (await getMenuRows(this.currentPage)).map(menuData => {
            return `<tr>
            <td class="max-icon-display">${menuData.icon}</td>
            <td>${menuData.name}</td>
            <td>${menuData.widgetName}</td>
            <td class="application-action-button" data-local-action="viewActions ${menuData.id}" ">
          ${actionButton}
         ${getDropDownMenu(menuData.id)}
        </td>
            </tr>`
        }).join('');
    }

    async afterRender() {
        this.element.querySelector("#selectedPage").addEventListener('change', (event) => {
            this.currentPage = event.target.value;
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
            id
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
        this.invalidate();
    }
}