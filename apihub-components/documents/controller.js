
async function getDocumentPage(request, response) {
    const documentId = "svd:document:" + request.params.documentId;
    console.log("sunt in server");
    // const posts = await getAllPosts(brandId);
    // let postsPage = "";
    // let postsArray = "";
    // if (posts) {
    //     postsArray = posts.map(post => getPostCard(post.post)).join(" ");
    // }
    // if(postsArray==="")
    //     postsArray="<post-card-skeleton></post-card-skeleton><post-card-skeleton></post-card-skeleton><post-card-skeleton></post-card-skeleton><post-card-skeleton></post-card-skeleton>";
    // postsPage += `
    //             <div class="posts-page">
    //                 <div class="posts-container">
    //                     <div class="add-post-card" data-action="showAddPostModal">
    //                         <img class="account-icon" src="./wallet/assets/icons/account-icon.svg"
    //                             alt="Account icon">
    //                         <div class="add-post-text-container">
    //                             <div>Create post</div>
    //                         </div>
    //                     </div>
    //                     ${postsArray}
    //                 </div>
    //             </div>`


    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write("ok");
    response.end();
}

module.exports = {
    getDocumentPage,
};
