export async function generateAvatar(name, size = 100) {
    let firstLetter = name.charAt(0).toUpperCase();
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Generate a random background color
    ctx.fillStyle = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(firstLetter, size / 2, size / 2);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    canvas.remove();
    return uint8Array;
}