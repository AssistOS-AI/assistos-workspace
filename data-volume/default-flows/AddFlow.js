export class AddFlow {
    static description = "Adds a new flow to be used to execute an operation in the application. A name is needed, the code written in JavaScript, as well as a list of tags to help identify it when filtering. Optionally, you can add a description"
    static inputSchema = {
            spaceId: "string",
            name: "string",
            description: "string",
            code: "string"

    }
    async start(context) {
        try {
            let flowModule = await this.loadModule("flow");
            context.code = "return " + context.code;
            const classConstructor = new Function(context.code);
            let flowClass = classConstructor();
            await flowModule.addFlow(context.spaceId, flowClass.name, "export " + flowClass.toString());
            this.return(flowClass.name);
        } catch (e) {
            this.fail(e);
        }
    }
}