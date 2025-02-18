const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Function to generate an SVG with a white background and text
function generateSvgBase64(name) {
    const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50%" y="50%" font-size="20" text-anchor="middle" fill="black" dy=".3em">${name}</text>
    </svg>`;
    return Buffer.from(svgContent).toString("base64");
}

// Main function
function setupRepo(repoUrl, appName, defaultPageName) {
    const tempDir = path.join(os.tmpdir(), "temp_repo");

    // Clean temp folder if it exists
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }

    console.log(`Cloning repository: ${repoUrl}`);
    execSync(`git clone ${repoUrl} ${tempDir}`, { stdio: "inherit" });

    // Generate encoded SVG icon
    const encodedSvgIcon = generateSvgBase64(appName);

    // Create manifest.json
    const manifestContent = {
        applicationName: appName,
        version: "1.0.0",
        encodedSvgIcon: encodedSvgIcon,
        entryPointComponent: `${defaultPageName}`,
        description: "Replace this placeholder with a proper description",
        componentsDirPath: "web-components",
        dependencies: [],
        components: [
            {
                name: `${defaultPageName}`,
                presenterClassName: "DefaultPresenter",
                type: "pages",
            },
        ],
        services: [
            {
                serviceName: "RoutingService",
                servicePath: "services/RoutingService.js",
            },
        ],
        manager: {
            path: "manager.js",
            name: "Manager",
        },
    };

    fs.writeFileSync(path.join(tempDir, "manifest.json"), JSON.stringify(manifestContent, null, 4));

    // Create manager.js
    const managerJsContent = `
import {RoutingService} from "./services/RoutingService.js";

export class Manager {
    constructor() {
        this.appName = "${appName}";
        this.services = new Map();
        this.services.set('RoutingService', new RoutingService());
    }

    async navigateToLocation(location) {
        this.services.get('RoutingService').navigateToLocation(location, this.appName);
    }
}`;
    fs.writeFileSync(path.join(tempDir, "manager.js"), managerJsContent.trim());

    // Create services/RoutingService.js
    const servicesDir = path.join(tempDir, "services");
    fs.mkdirSync(servicesDir, { recursive: true });

    const routingServiceJsContent = `
const NAME = "${defaultPageName}";

export class RoutingService {
    constructor() {
        if (RoutingService.instance) {
            return RoutingService.instance;
        } else {
            RoutingService.instance = this;
            return this;
        }
    }

    async navigateToLocation(locationArray = [], appName) {
        if (locationArray.length === 0 || locationArray[0] === NAME) {
            const pageUrl = \`\${assistOS.space.id}/\${appName}/\${NAME}\`;
            await assistOS.UI.changeToDynamicPage(NAME, pageUrl);
            return;
        }
        if (locationArray[locationArray.length - 1] !== NAME) {
            console.error(\`Invalid URL: URL must end with \${NAME}\`);
            return;
        }
        const webComponentName = locationArray[locationArray.length - 1];
        const pageUrl = \`\${assistOS.space.id}/\${appName}/\${locationArray.join("/")}\`;
        await assistOS.UI.changeToDynamicPage(webComponentName, pageUrl);
    }

    static async navigateInternal(subpageName, presenterParams) {
        try {
            const pageUrl = \`\${assistOS.space.id}/${appName}/\${subpageName}\`;
            await assistOS.UI.changeToDynamicPage(subpageName, pageUrl, presenterParams);
        } catch (error) {
            console.error('Navigation error:', error);
            throw error;
        }
    }
}`;
    fs.writeFileSync(path.join(servicesDir, "RoutingService.js"), routingServiceJsContent.trim());

    // Create web-components/landing-page directory
    const landingPageDir = path.join(tempDir, "web-components", defaultPageName);
    fs.mkdirSync(landingPageDir, { recursive: true });

    // Create landing-page.html
    const landingPageHtmlContent = `
<div class="main-container">
    <div class="content-card">
        <div class="header">
            <h1>${appName}</h1>
        </div>
        <div class="content">
            start your work...
        </div>
    </div>
</div>`;
    fs.writeFileSync(path.join(landingPageDir, `${defaultPageName}.html`), landingPageHtmlContent.trim());

    // Create landing-page.js
    const landingPageJsContent = `
export class DefaultPresenter {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;

        this.invalidate(async () => {
        });
    }

    async beforeRender() {

    }

    async afterRender() {

    }
}`;
    fs.writeFileSync(path.join(landingPageDir, `${defaultPageName}.js`), landingPageJsContent.trim());

    console.log("Files created successfully!");

    // Commit and push changes
    execSync(`git -C ${tempDir} add .`, { stdio: "inherit" });
    execSync(`git -C ${tempDir} commit -m "Added default project files for ${appName}"`, { stdio: "inherit" });
    execSync(`git -C ${tempDir} push origin main`, { stdio: "inherit" });

    console.log("Changes pushed successfully!");

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
}

// Get arguments
const [repoUrl, appName, defaultPageName] = process.argv.slice(2);
if (!repoUrl || !appName) {
    console.error("Usage: node createApp.js <GitHubRepoURL> <AppName> <defaultPageName>");
    process.exit(1);
}

// Execute
setupRepo(repoUrl, appName, defaultPageName || "landing-page");
