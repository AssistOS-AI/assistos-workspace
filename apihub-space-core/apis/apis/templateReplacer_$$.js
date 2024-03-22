/*
function templateReplacer_$$(template, templateDataObject, depth = 0) {
    const MAX_DEPTH = 10;

    function replaceString(string) {
        let result = string;
        Object.entries(templateDataObject).forEach(([key, value]) => {
            const isOptional = key.endsWith('?');
            const actualKey = isOptional ? key.slice(0, -1) : key;
            const placeholder = `\\$\\$${actualKey}`;

            if (value !== undefined) {
                let replacement;
                if (typeof value === 'object') {
                    replacement = JSON.stringify(value);
                    result = result.replace(new RegExp(`"${placeholder}"`, 'g'), replacement);
                } else {
                    replacement = value.toString();
                    result = result.replace(new RegExp(placeholder, 'g'), replacement);
                }
            } else if (isOptional) {
                result = result.replace(new RegExp(`"${placeholder}\\?"`, 'g'), '');
            }
        });
        return result;
    }

    function replaceRecursively(currentPart, depth) {
        if (depth > MAX_DEPTH) {
            throw new Error("Depth Overreach. Possible Circular Dependency");
        }

        if (typeof currentPart === 'string') {
            return replaceString(currentPart);
        } else if (Array.isArray(currentPart)) {
            return currentPart.map(element => replaceRecursively(element, depth + 1));
        } else if (typeof currentPart === 'object' && currentPart !== null) {
            Object.keys(currentPart).forEach(key => {
                currentPart[key] = replaceRecursively(currentPart[key], depth + 1);
            });
            return currentPart;
        }

        return currentPart;
    }

    return replaceRecursively(template, 0);
}
*/

function templateReplacer_$$(templateObject, fillObject, depth = 0) {
    /* Todo: Implement a detection mechanism for circular dependencies instead of a hardcoded nested depth limit */

    if (depth > 10) {
        throw new Error("Depth Overreach. Possible Circular Dependency");
    }

    const containsPlaceholder = (templateObjectValueString) => {
        const placeholderPattern = /\$\$[a-zA-Z0-9_]+(\?)?/g;
        return placeholderPattern.test(templateObjectValueString);
    }

    if (typeof templateObject === 'string') {
        if (containsPlaceholder(templateObject)) {
            let resultString = "";
            let buffer = "";
            let placeholder = "";
            let i = 0;

            while (i < templateObject.length) {
                if (templateObject[i] === '$' && templateObject[i + 1] === '$') {
                    if (buffer.length > 0) {
                        resultString += buffer;
                        buffer = "";
                    }
                    i += 2;
                    while (i < templateObject.length &&
                    /[\w?]/.test(templateObject[i])) {
                        placeholder += templateObject[i];
                        i++;
                    }

                    const optionalPlaceholder = placeholder.endsWith('?');
                    const placeholderKey = optionalPlaceholder ? placeholder.slice(0, -1) : placeholder;
                    if (fillObject.hasOwnProperty(placeholderKey)) {
                        let placeholderValue = fillObject[placeholderKey];
                        // Determină dacă acesta este singurul conținut al string-ului
                        let isFullReplacement = templateObject.trim() === `$$${placeholderKey}` || templateObject.trim() === `$$${placeholderKey}?`;

                        if (typeof placeholderValue === 'object') {
                            if (!Array.isArray(placeholderValue) && !isFullReplacement) {
                                resultString += JSON.stringify(placeholderValue);
                            } else if (Array.isArray(placeholderValue) && !isFullReplacement) {
                                resultString += JSON.stringify(placeholderValue);
                            } else {
                                // Pentru înlocuirile directe unde întregul string este placeholder-ul
                                // și valoarea este un obiect sau array, păstrează structura originală
                                return placeholderValue;
                            }
                        } else if (placeholderValue === undefined && optionalPlaceholder) {
                            resultString += "";
                        } else {
                            resultString += placeholderValue.toString();
                        }
                    } else if (!optionalPlaceholder) {
                        throw new Error(`Missing required fill data for "${placeholderKey}"`);
                    }
                    placeholder = "";
                } else {
                    buffer += templateObject[i];
                    i++;
                }
            }
            resultString += buffer; // Adaugă restul string-ului care nu face parte dintr-un placeholder
            return resultString;
        } else {
            return templateObject; // String-ul nu conține placeholder-e.
        }
    } else if (Array.isArray(templateObject)) {
        return templateObject.reduce((acc, currentElement) => {
            const replacedElement = templateReplacer_$$(currentElement, fillObject, depth + 1);
            if (replacedElement !== "") {
                acc.push(replacedElement);
            }
            return acc;
        }, []);

    } else if (typeof templateObject === 'object') {
        const newObj = {};
        for (const [key, value] of Object.entries(templateObject)) {
            newObj[key] = templateReplacer_$$(value, fillObject, depth + 1);
        }
        return newObj;
    }else{
        return templateObject;
    }
}

module.exports = templateReplacer_$$;
