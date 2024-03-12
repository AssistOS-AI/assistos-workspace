export function templateReplacer_$$(obj, replacements, depth = 0) {
    if (depth > 10) {
        throw new Error("Depth Overreach. Possible Circular Dependency");
    }

    function replaceInString(str) {
        let modified = str, foundReplacement;
        do {
            foundReplacement = false;
            for (const [key, value] of Object.entries(replacements)) {
                const placeholder = `$$${key}`;
                if (modified.includes(placeholder)) {
                    modified = modified.split(placeholder).join(value);
                    foundReplacement = true;
                }
            }
        } while (foundReplacement);
        return modified;
    }

    function replaceRecursively(currentObj) {
        if (typeof currentObj === 'string') {
            return replaceInString(currentObj);
        } else if (Array.isArray(currentObj)) {
            return currentObj.map(item => replaceRecursively(item, replacements, depth + 1));
        } else if (typeof currentObj === 'object' && currentObj !== null) {
            const result = {};
            for (const [key, value] of Object.entries(currentObj)) {
                result[key] = replaceRecursively(value, replacements, depth + 1);
            }
            return result;
        }
        return currentObj;
    }

    return replaceRecursively(obj);
}
