class ITextLLM{
    constructor(){
        if(new.target===ITextLLM){
            throw new TypeError("Cannot construct Interface")
        }
    }
}