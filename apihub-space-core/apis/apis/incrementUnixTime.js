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
module.exports=incrementUnixTime;