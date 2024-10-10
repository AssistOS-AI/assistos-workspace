export function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    let remainingSeconds = Math.floor(seconds % 60);
    remainingSeconds = String(remainingSeconds).padStart(2, '0');

    if (hours > 0) {
        return `${hours}:${minutes}:${remainingSeconds}`;
    }
    return `${minutes}:${remainingSeconds}`;
}
