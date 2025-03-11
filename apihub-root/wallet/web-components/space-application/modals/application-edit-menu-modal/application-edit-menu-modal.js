const getMenuItemData = async (id) => {
    return {
        name: "Menu Item Name",
        widgetName: "Widget Name"
    }
}
const getPageData = async (id) => {
    return {
        name: "Page Name",
        widgetName: "Widget Name",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        data: "Lorem ipsum dolor sit amet, consectetur adipiscing elit"
    }
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

export class ApplicationEditMenuModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.id = this.element.getAttribute('data-id');
    }

    async beforeRender() {
        if (this.id) {
            await this.handleEditRender();
        } else {
            await this.handleAddRender();
        }
    }

    async handleAddRender() {
        this.modalName = "Add Menu Item";
        this.actionButton = "Add";
        this.actionFn = `addMenuItem`;
        this.pages = `<select class="application-form-item-select" name="selectedPage" id="selectedPage">${
            (await getPageRows()).map(pageData => {
                return `<option value="${pageData.name}">${pageData.name}</option>`
            }).join('')}</select>`
    }

    async handleEditRender() {
        this.modalName = "Edit Menu Item";
        this.actionButton = "Save";
        this.actionFn = `editMenuItem`;
        this.pages = `<input type="text" class="application-form-item-input" id="selectedPage" name="selectedPage" value="Page Name" disabled>`
        const menuItemData = await getMenuItemData(this.id);
        this.name = menuItemData.name;
        this.widgetName = menuItemData.widgetName;
    }

    async afterRender() {
        const fileInput = this.element.querySelector('#customFile');
        const fileLabel = this.element.querySelector('.file-input-label span:last-child');
        const selectedPageSelectElement = this.element.querySelector('#selectedPage');
        const nameInput = this.element.querySelector('#display-name');
        this.lastSelectedPage = selectedPageSelectElement.value;
        nameInput.value=this.lastSelectedPage;
        selectedPageSelectElement.addEventListener('change', (e) => {
            if (nameInput.value === '' || nameInput.value === this.lastSelectedPage) {
                nameInput.value = e.target.value;
                this.lastSelectedPage = e.target.value;
            }
        })

        const iconContainer = this.element.querySelector('.file-input-label span:first-child');
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                fileLabel.textContent = file.name;
                const reader = new FileReader();
                reader.onload = function (e) {
                    iconContainer.style.width = '200px';
                    iconContainer.style.height = '200px';
                    iconContainer.style.transition = 'all 0.3s ease';
                    iconContainer.innerHTML = ` <img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: contain;"> `;
                }
                reader.readAsDataURL(file);
            } else {
                fileLabel.textContent = 'No file selected';
                iconContainer.style.width = '24px';
                iconContainer.style.height = '24px';
                iconContainer.innerHTML = '<i class="fas fa-cloud-upload-alt"></i>';
            }
        });
    }

    async closeModal() {
        await assistOS.UI.closeModal(this.element, {shouldInvalidate: this.shouldInvalidate});
    }

    async addMenuItem() {
        console.log('addMenuItem');
        await this.closeModal();
    }

    async editMenuItem() {
        console.log('editMenuItem');
        await this.closeModal();
    }
}

