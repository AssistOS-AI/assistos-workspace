const logger = $$.getLogger("brand", "apihub-components");
const openDSU = require("opendsu");

async function getDocumentPage(request, response) {
    const documentId = "svd:document:" + request.params.documentId;
    console.log("sunt in server");
    // const posts = await getAllPosts(brandId);
    let postsPage = "";
    // let postsArray = "";
    // if (posts) {
    //     postsArray = posts.map(post => getPostCard(post.post)).join(" ");
    // }
    // if(postsArray==="")
    //     postsArray="<post-card-skeleton></post-card-skeleton><post-card-skeleton></post-card-skeleton><post-card-skeleton></post-card-skeleton><post-card-skeleton></post-card-skeleton>";
    postsPage += `
                <div class="posts-page">
                    
                </div>`


    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(postsPage);
    response.end();
}

module.exports = {
    getDocumentPage,
};
