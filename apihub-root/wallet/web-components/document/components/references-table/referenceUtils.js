export function generateAPACitation(data) {
    if (!data.authors || !data.year || !data.title) {
        return "Please fill in required fields to see preview";
    }

    let citation = `${data.authors} (${data.year}). `;

    switch (data.type) {
        case 'journal':
            citation += `${data.title}. `;
            if (data.journal) {
                citation += `*${data.journal}*`;
                if (data.volume) citation += `, ${data.volume}`;
                if (data.pages) citation += `, ${data.pages}`;
                citation += '. ';
            }
            break;

        case 'book':
            citation += `*${data.title}*. `;
            if (data.publisher) {
                if (data.location) citation += `${data.location}: `;
                citation += `${data.publisher}. `;
            }
            break;

        case 'website':
            citation += `${data.title}. `;
            if (data.website) citation += `*${data.website}*. `;
            if (data.accessDate) {
                const date = new Date(data.accessDate);
                citation += `Retrieved ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. `;
            }
            break;

        case 'report':
            citation += `*${data.title}*`;
            if (data.publisher) citation += ` (Report). ${data.publisher}`;
            citation += '. ';
            break;

        default:
            citation += `*${data.title}*. `;
    }

    if (data.url) {
        if (data.url.startsWith('doi:')) {
            citation += `https://doi.org/${data.url.substring(4)}`;
        } else {
            citation += data.url;
        }
    }

    return citation;
}