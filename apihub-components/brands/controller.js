
const logger = $$.getLogger("brand", "apihub-components");
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
    let isFollowed="follow";

    if(brand.followed)
    {
        isFollowed="followed";
    }
    return `<brand-card data-id="${brand.brandId}" data-name="${brand.brandName}" 
    data-is-followed="${isFollowed}" data-logo="${brand.brandLogo}"></brand-card>`
}

async function getBrandsPage(request, response) {
    const { domain, brandId } = request.params;
    logger.debug(`Getting page for domain ${domain} and brand ${brandId}...`);

    const brands = await getAllBrands();
    const brandsFollow = await getAllBrandsFollow();

    let brandsId=[];
    for(let i=0;i<brandsFollow.length;i++) {
        brandsId[i]=brandsFollow[i].brandFollow.brandId;
    }
    let followedBrandsArray="";
    let suggestedBrandsArray = "";

        for(let i=0;i<brands.length;i++) {
            if(brandsId.includes(brands[i].brand.brandId)) {
                brands[i].brand.followed=true;
                followedBrandsArray += getBrandCard(brands[i].brand);
            } else {
                brands[i].brand.followed=false;
                suggestedBrandsArray += getBrandCard(brands[i].brand);
            }
        }
        //fix this^^^^
    let brandPage = "";

    brandPage += `
                    <div class="brands-container">
                        <div class="add-brand-wrapper">
                        <div class="add-brand-button" data-action="showAddBrandModal"> 
                            <div class="plus-button-wrapper">
                                <img class="plus-icon" src="./assets/icons/plus-icon.svg"
                        alt="Plus icon">
                            </div>
                            <div class="create-community-button">Create a community</div>
                        </div>
                        </div> 
                        <div class="followed-container">
                            <div class="title-wrapper">
                                    <div class="followed-brands-title">Followed brands</div>
                                    <div class="see-all-button">See All</div> 
                            </div>
                            <div class="brands-list">
                                ${followedBrandsArray}
                            </div>
                        </div>
                        <div class="suggested-container">
                            <div class="title-wrapper">Suggested brands</div>
                            <div class="brands-list">
                               ${suggestedBrandsArray}
                            </div>
                        </div>
                    </div>
                  `
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(brandPage);
    response.end();
}

module.exports = {
    getBrandsPage,
};
