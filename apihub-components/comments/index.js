function Comments(server) {
    const { getPostPage } = require("./controller");

    server.get("/:domain/comments/:postId", getPostPage);
}

module.exports = Comments;
