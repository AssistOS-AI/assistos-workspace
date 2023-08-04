const logger = $$.getLogger("tool", "apihub-components");
const openDSU = require("opendsu");

const getSc = async () => {
    return new Promise((resolve, reject) => {
        const sc = openDSU.loadAPI("sc").getSecurityContext();
        if (sc.isInitialised()) {
            resolve(sc);
        }
        else {
            sc.on("initialised", (err) => {
                if (err) {
                    reject(err);
                }
                resolve(sc);
            })
        }
    })
}

const getRemoteEnclaveClient = async () => {
    if (!$$.remoteEnclaveClient) {
        await getSc();
        const w3cDID = openDSU.loadAPI("w3cdid");
        const enclaveAPI = openDSU.loadAPI("enclave");

        const remoteDID = "did:ssi:name:vault:BrandEnclave";
        const clientDIDDocument = await $$.promisify(w3cDID.resolveNameDID)("vault", "clientEnclaveApihub", "topSecretApihub");
        logger.info("Client apihub enclave: " + clientDIDDocument.getIdentifier());
        $$.remoteEnclaveClient = enclaveAPI.initialiseRemoteEnclave(clientDIDDocument.getIdentifier(), remoteDID);
    }
    return $$.remoteEnclaveClient;
}

const getAllBrands = async function () {
    try {
        const remoteEnclaveClient = await getRemoteEnclaveClient();
        return await $$.promisify(remoteEnclaveClient.getAllRecords)("", "brands");
    }
    catch (err) {
        logger.error("Error at initialising remote client" + err);
        return undefined;
    }
}

const getAllBrandsFollow = async function () {
    try {
        const remoteEnclaveClient = await getRemoteEnclaveClient();
        return await $$.promisify(remoteEnclaveClient.getAllRecords)("", "brandsFollow");
    }
    catch (err) {
        logger.error("Error at initialising remote client" + err);
        return undefined;
    }
}

const getBrandCard = (brand) => {
    // const postNumbers = brand.postsOwnership ? Object.keys(brand.postsOwnership)
    //     .reduce((prev, current) => prev += brand.postsOwnership[current].length, 0) : 0;


    // let isFollowed="follow";
    //
    // if(brand.followed) {
    //     isFollowed="followed";
    // }

    return `<tool-card data-id="${brand.brandId}" data-name="${brand.brandName}"
    data-is-followed="${isFollowed}" data-logo="${brand.brandLogo}">heyoo</tool-card>`
}

async function getToolPage(request, response) {
    const { domain, toolId } = request.params;
    logger.debug(`Getting page for domain ${domain} and tool ${toolId}...`);

    let toolPage = "";

    toolPage += `
                   <div class="title-container">LLMS tool ${toolId}</div>
                            <div class="add-button-section">
                                <div class="add-button">
                                    <img src="assets/icons/Vector.png" alt="Add icon" class="add-icon">
                                    Add LLM
                                </div>
                            </div>
                            <div class="table">
                                <div class="table-header table-line">
                                    <div class="header-cell cell">NAME</div>
                                    <div class="header-cell cell">KEY</div>
                                    <div class="header-cell cell">URL</div>
                                </div>
                                <div class="table-line border-line">
                                    <div class="cell">Machin1.0</div>
                                    <div class="cell">Webfdbefudh222</div>
                                    <div class="cell">www.reddit.com/r...</div>
                                </div>
                                <div class="table-line border-line">
                                    <div class="cell">Machin1.0</div>
                                    <div class="cell">Webfdbefudh222</div>
                                    <div class="cell">www.reddit.com/r...</div>
                                </div>
                                <div class="table-line">
                                    <div class="cell">Machin1.0</div>
                                    <div class="cell">Webfdbefudh222</div>
                                    <div class="cell">www.reddit.com/r...</div>
                                </div>
                            </div>
                         </div>
                  `
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(toolPage);
    response.end();
}

module.exports = {
    getToolPage,
};
