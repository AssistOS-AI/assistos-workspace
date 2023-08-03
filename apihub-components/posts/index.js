function Posts(server) {
    const { getPosts } = require("./controller");

    server.get("/:domain/posts/:brandId", getPosts);
}

module.exports = Posts;
