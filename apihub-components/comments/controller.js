const logger = $$.getLogger("comments", "apihub-components");
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


const getPost = async function (remoteEnclaveClient, postId) {

    try {
        const post = await $$.promisify(remoteEnclaveClient.getRecord)("", "posts", postId);
        if (post) {
            return post.post;
        }
        return undefined;
    }
    catch (err) {
        logger.error("Error at initialising remote client" + err);
        return undefined;
    }
}

const getComments = async function (remoteEnclaveClient, postId) {

    try {
        const result = await $$.promisify(remoteEnclaveClient.getAllRecords)("", "comments");
        console.log("@@@", result[0].comment, postId);
        if (result) {
            return result.filter(comment => comment.comment.postId == postId)
        }
        return [];
    }
    catch (err) {
        logger.error("Error at initialising remote client" + err);
        return undefined;
    }
}

const getCommentCard = function (comment) {
    return `<comment-card data-body="${comment.body}"></comment-card>`
}

async function getPostPage(request, response) {
    let { domain, postId } = request.params;
    postId = "svd:post:post" + postId;
    const remoteEnclaveClient = await getRemoteEnclaveClient();
    const post = await getPost(remoteEnclaveClient, postId);
    const comments = await getComments(remoteEnclaveClient, postId);

    let commentsArray = "";
    if (comments) {
        commentsArray = comments.map(comment => getCommentCard(comment.comment)).join(" ");
    }

    let isActivated="show-element";

    if(post.isActivated)
    {
        isActivated="hide-element";
    }
     const postPage =
        `
     <div class="post-card post-card-padding-reducer">
      <div class="post-card-wrapper">
       <div class="post-card-container">
        <post-card data-title="${post.title}" data-body="${post.body}"
            data-is-activated="${isActivated}" data-post-id="${post.postId}"></post-card>
           <add-comment-card data-post-id="${post.postId}"></add-comment-card>
      <div class="comments-container">${commentsArray}</div>
       </div>
       </div>
     </div>
        `


    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(postPage);
    response.end();
}

module.exports = {
    getPostPage: getPostPage,
};
