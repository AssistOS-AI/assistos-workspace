export class BlogWidget{
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.invalidate();
    }

    async beforeRender() {
        this.blogTitle = this.props.data?.title || "Latest Blog Post";
        this.blogContent = this.props.data?.content || "Stay tuned for updates on our latest projects.";
        this.blogDate = this.props.data?.date || new Date().toLocaleDateString();
    }

    async afterRender() {}
}
