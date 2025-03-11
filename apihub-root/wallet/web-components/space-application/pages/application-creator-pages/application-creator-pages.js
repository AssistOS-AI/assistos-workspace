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

export class ApplicationCreatorPages {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.pageName = "Pages"
        this.invalidate();
    }

    async beforeRender() {

        this.pageRows = (await getPageRows()).map(pageData => {
            return `<tr>
            <td>${pageData.name}</td>
            <td>${pageData.widgetName}</td>
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

    async deletePage(evenTarget) {
            this.invalidate();
    }
}