export function decodePercentCustom(encodedStr) {
    // Return empty string if input is not a string
    if (typeof encodedStr !== 'string') return '';

    // Regex matches '%' followed by exactly two hexadecimal digits (0-9, A-F, case-insensitive).
    // It captures the two hex digits into group 1.
    return encodedStr.replace(/%([0-9A-Fa-f]{2})/g, (match, hexDigits) => {
        // `hexDigits` contains the two hex characters (e.g., '0A', '27', '5B')
        // Convert the hex digits (string) back to an integer character code
        const charCode = parseInt(hexDigits, 16);
        // Convert the character code back to its corresponding character
        return String.fromCharCode(charCode);
    });
}