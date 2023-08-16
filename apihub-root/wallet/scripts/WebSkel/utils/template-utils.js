export function findDoubleDollarWords(str) {
    let regex = /\$\$[\w\-_]+/g;
    return str.match(regex) || []; // Returnează un array de cuvinte sau un array gol dacă nu se găsesc cuvinte
}

export function createTemplateArray(str) {
    let currentPos = 0;
    const STR_TOKEN = 0;
    const VAR_TOKEN = 1;
    function isSeparator(ch) {
        const regex = /^[a-zA-Z0-9_\-$]$/;
        return !regex.test(ch);
    }

    function startVariable(cp) {
        if(str[cp] !== '$' || str[cp+1] !== '$') {
            return STR_TOKEN;
        }
        else {
            return VAR_TOKEN;
        }
    }
    let result = [];
    let k = 0;
    while(k < str.length ) {
        while(!startVariable(k) && k < str.length) {
            k++;
        }
        result.push(str.slice(currentPos, k));
        currentPos = k;

        while(!isSeparator(str[k]) && k < str.length) {
            k++;
        }
        result.push(str.slice(currentPos, k));
        currentPos = k;
    }
    return result;
}
// module.exports={findDoubleDollarWords,createTemplateArray};

