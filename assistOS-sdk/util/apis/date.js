function getCurrentUnixTime() {
    return Math.floor(Date.now() / 1000);
}
function incrementUnixTime(unixTimestamp, incrementObject) {
    const {seconds = 0, minutes = 0, hours = 0, days = 0, months = 0, years = 0} = incrementObject;
    const totalSeconds = seconds +
        minutes * 60 +
        hours * 3600 +
        days * 86400 +
        months * 2629746 +
        years * 31556952;

    return unixTimestamp + totalSeconds;
}

function getCurrentUTCDate() {
    const now = new Date();

    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
}
function incrementUTCDate(dateStringUTC, incrementObject) {
    const {seconds = 0, minutes = 0, hours = 0, days = 0, months = 0, years = 0} = incrementObject;
    let date = new Date(dateStringUTC);
    date.setUTCSeconds(date.getUTCSeconds() + seconds);
    date.setUTCMinutes(date.getUTCMinutes() + minutes);
    date.setUTCHours(date.getUTCHours() + hours);
    date.setUTCDate(date.getUTCDate() + days);
    date.setUTCMonth(date.getUTCMonth() + months);
    date.setUTCFullYear(date.getUTCFullYear() + years);

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    const minute = String(date.getUTCMinutes()).padStart(2, '0');
    const second = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
}
function compareUTCDates(d1, d2) {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getTime() - date2.getTime();
}

function compareUnixDates(t1, t2) {
    return t1 - t2;
}


module.exports = {
    getCurrentUTCDate,
    getCurrentUnixTime,
    incrementUTCDate,
    incrementUnixTime,
    compareUTCDates,
    compareUnixDates
};
