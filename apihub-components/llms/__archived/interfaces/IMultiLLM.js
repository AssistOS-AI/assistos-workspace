class IMultiLLM {
    constructor(){
        if (new.target === IMultiLLM) {
            throw new Error("ILLM cannot be instantiated directly.");
        }
    }

}