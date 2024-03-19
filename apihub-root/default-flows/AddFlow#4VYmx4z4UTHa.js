export class AddFlow {
    static id = "4VYmx4z4UTHa";
    static description = "Adds a new flow to be used to execute an operation in the application. A name is needed, the code written in JavaScript, as well as a list of tags to help identify it when filtering. Optionally, you can add a description"
    static parameters = [
        { name: "name", type: "string", description: "The name of the flow.", optional: false },
        { name: "description", type: "string", description: "The description of the flow.", optional: true },
        { name: "code", type: "string", description: "The code/content of the flow.", optional: false },
        { name: "tags", type: "array", description: "An array of tags associated with the flow.", optional: false }
    ];
    constructor() {

    }

    async start(code) {
        try {
            code = "return " + code;
            const classConstructor = new Function(code);
            let flowClass = classConstructor();
            await system.space.addFlow(flowClass);
            this.return(flowClass.name);
        } catch (e) {
            this.fail(e);
        }
    }
}