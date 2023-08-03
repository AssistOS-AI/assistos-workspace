module.exports = {
    ctor: function (brandId, brandName, brandLogo, brandDescription, brandUrl) {
        this.brandId = brandId;
        this.brandName = brandName;
        this.brandLogo = brandLogo;
        this.brandDescription = brandDescription;
        this.brandUrl=brandUrl;
        this.postsOwnership = {};
        this.commentsOwnership = {};
        /* keep an array of pairs timestmap postId,  preserve maximum 100 recent posts but update the timestamp at updates*/
        this.wall = [];
    },
    read: function () {
        return this.getState();
    },
    updateWall: function (timestamp, postId) {
        //find the index of the post in the wall
        let index = -1;
        for (let i = 0; i < this.wall.length; i++) {
            if (this.wall[i].postId == postId) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            this.wall[index].timestamp = timestamp;
        } else {
            if (this.wall.length < 100) {
                this.wall.push({ timestamp: timestamp, postId: postId });
            } else {
                //find the oldest post in the wall
                let oldestIndex = 0;
                for (let i = 1; i < this.wall.length; i++) {
                    if (this.wall[i].timestamp < this.wall[oldestIndex].timestamp) {
                        oldestIndex = i;
                    }
                }
                this.wall[oldestIndex].timestamp = timestamp;
                this.wall[oldestIndex].postId = postId;
            }
        }
    },
    actions: {
        update: function (brandName, brandLogo, brandDescription, brandUrl) {
            this.brandName = brandName;
            this.brandLogo = brandLogo;
            this.brandDescription = brandDescription;
            this.brandUrl=brandUrl;
        },
        registerCommentOwnership: function (ownerDID, commentID, postId, timestamp) {
            if (this.commentsOwnership[ownerDID] == undefined) {
                this.commentsOwnership[ownerDID] = [];
            }
            this.commentsOwnership[ownerDID].push(commentID);
            this.updateWall(timestamp, postId);
        },
        registerPostOwnership: function (ownerDID, postID, timestamp) {
            if (this.postsOwnership[ownerDID] == undefined) {
                this.postsOwnership[ownerDID] = [];
            }
            this.postsOwnership[ownerDID].push(postID);
            this.updateWall(timestamp, postID);
        },
        updatePostOwnership: function (oldOwnerDID, ownerDID, postId, timestamp) {
            if (this.postsOwnership[oldOwnerDID] == undefined) {
                console.error("Assert failed: oldOwnerDID should have ownership of postID");
                this.postsOwnership[oldOwnerDID] = [];
            }
            let index = this.postsOwnership[oldOwnerDID].indexOf(postId);
            if (index > -1) {
                this.postsOwnership[oldOwnerDID].splice(index, 1);
            }
            if (this.postsOwnership[ownerDID] == undefined) {
                this.postsOwnership[ownerDID] = [];
            }
            this.postsOwnership[ownerDID].push(postId);
            this.updateWall(timestamp, postId);
        }
    }
}