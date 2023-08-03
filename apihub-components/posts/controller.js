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

const getAllPosts = async function (brandId) {

    try {
        const remoteEnclaveClient = await getRemoteEnclaveClient();
        const result = await $$.promisify(remoteEnclaveClient.getAllRecords)("", "posts");
        if (result) {
            return result.filter(post => post.post.brandId == brandId)
        }
        return [];
    }
    catch (err) {
        logger.error("Error at initialising remote client" + err);
        return undefined;
    }

}

const getPostCard = (post) => {
    // const postNumbers = brand.postsOwnership ? Object.keys(brand.postsOwnership)
    //     .reduce((prev, current) => prev += brand.postsOwnership[current].length, 0) : 0;
    console.log("@@", post);
    let isActivated="show-element";

    if(post.isActivated)
    {
        isActivated="hide-element";
    }
    return `<post-card data-title="${post.title}" data-body="${post.body}" 
            data-is-activated="${isActivated}" data-post-id="${post.postId}">
           </post-card>`
}

async function getPosts(request, response) {
    const brandId = "svd:brand:brand" + request.params.brandId;
    const posts = await getAllPosts(brandId);
    let postsPage = "";
    let postsArray = "";
    if (posts) {
        postsArray = posts.map(post => getPostCard(post.post)).join(" ");
    }

    /* static posts for testing the UI - To Be Removed */
    //postsArray=generateStaticPosts();

    postsPage += `
                <div class="posts-page"> 
                    <div class="posts-container">
                        <div class="add-post-card" data-action="showAddPostModal">
                            <img class="account-icon" src="./assets/icons/account-icon.svg"
                                alt="Account icon">
                            <div class="add-post-text-container">
                                <div>Create post</div>
                            </div>
                        </div> 
                        ${postsArray}
                    </div>
                </div>`


    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(postsPage);
    response.end();
}

module.exports = {
    getPosts,
};
