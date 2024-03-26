function incrementDate(dateStringUTC, incrementObject) {
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

module.exports = incrementDate