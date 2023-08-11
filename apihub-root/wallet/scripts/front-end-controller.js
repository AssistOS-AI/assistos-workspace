import { appBaseUrl, getApihubUrl } from "./utils/url-utils.js";

const opendsu = require("opendsu");
const http = opendsu.loadApi("http");

// async function fetchTextResult(relativeUrlPath, skipHistoryState) {
//     if(relativeUrlPath.startsWith("#")) {
//         relativeUrlPath=relativeUrlPath.slice(1);
//     }
//     const response = await http.fetch(getApihubUrl(relativeUrlPath));
//     if (!response.ok) {
//         throw new Error("Failed to execute request");
//     }
//
//     const result = await response.text();
//
//     if (!skipHistoryState) {
//         // const path = new URL(relativeUrlPath, baseUrl);
//         const path = appBaseUrl + "#" + relativeUrlPath; // leave baseUrl for now
//         window.history.pushState({ relativeUrlPath, relativeUrlContent: result }, path.toString(), path);
//     }
//     return result;
// }

function getDynamicPage(pageHtmlTagName, skipHistoryState) {
    let result = `<${pageHtmlTagName}></${pageHtmlTagName}>`;
    if (!skipHistoryState) {
        const path = appBaseUrl + "#" + pageHtmlTagName; // leave baseUrl for now
        window.history.pushState({ pageHtmlTagName, relativeUrlContent: result }, path.toString(), path);
    }
    return result;
}

class FrontEndController {
    getToolPage(domain, pageName) {
        return getDynamicPage(pageName);
    }

    getToolsPage(domain) {
        return fetchTextResult(`${domain}/tools`,true);
    }

    getPage(relativeUrl) {
        return relativeUrl === "" ? "" : fetchTextResult(relativeUrl);
    }
}

export default FrontEndController;
