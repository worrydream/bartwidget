//-----------------------------------------------------------------------------
//  DateUtils.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  Date-munging functions.
//

function dateNow () {
    return new Date()
}

function datePlusMinutes (date, minutes) {
    var ms = date.getTime() + minutes*60*1000
    return new Date(ms)
}

function getMinutesBetweenDates (date1, date2) {
    var ms = date2.getTime() - date1.getTime()
    return ms/1000/60
}

function minutesSinceMidnightToTimeString (minutes_since_midnight) {
    var hours = Math.floor(minutes_since_midnight / 60)
    var min   = minutes_since_midnight % 60
    var ampm = (hours < 12) ? "am" : "pm"
    if (hours == 0) { hours = 12 }
    else if (hours > 12) { hours = hours - 12 }
    if (min < 10) { min = "0" + min }
    return "" + hours + ":" + min + " " + ampm
}

// Accepts times in any of the forms:  "1:00 pm", "1:00 PM", "13:00", "13", "1300"
function timeStringToMinutesSinceMidnight (time_string, can_return_undefined) {
    var hours = 0;
    var min = 0;
    
    // Check for am/pm.
    var ampm = time_string.match(/am/i) ? "am"
             : time_string.match(/pm/i) ? "pm"
             : time_string.match(/a/i)  ? "am"
             : time_string.match(/p/i)  ? "pm" 
             : undefined

    // Try form "hh:mm".
    var matches = /(\d+)\:(\d+)/.exec(time_string)
    if (matches) {  hours = parseInt(matches[1]);  min = parseInt(matches[2])  }
    else {
        matches = /\d+/.exec(time_string)
        if (matches) {
            var number = parseInt(matches[0])
            // Try form "hhmm".
            if (number >= 100) {  hours = Math.floor(number / 100);  min = number % 100  }
            // Try form "hh".
            else {  hours = number;  min = 0  }
        }
        else {
            if (can_return_undefined) { return undefined }
        }
    }
    if (ampm == "pm" && hours < 12) { hours += 12 }
    else if (ampm == "am" && hours == 12) { hours = 0 }
    if (hours > 23) { hours = 23 }
    if (min > 59) { min = 59 }
    return hours * 60 + min
}

function dateToStringAsHHMM (date) {
    var hours = date.getHours()
    var min = date.getMinutes()
    if (hours == 0) { hours = 12 }
    else if (hours > 12) { hours = hours - 12 }
    if (min < 10) { min = "0" + min }
    return "" + hours + ":" + min
}

function getMinutesSinceMidnight (date) {
    var midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0)
    return getMinutesBetweenDates(midnight,date)
}

// dateQuantizedDownToMinutes(ten_o_four, 15) == ten_o_clock
// dateQuantizedDownToMinutes(ten_fifty,  15) == ten_forty_five
function dateQuantizedDownToMinutes (date, minutes) {
    var offset = (getMinutesSinceMidnight(date) % minutes)
    return datePlusMinutes(date, -offset)
}

// dateAtEarlierHour(ten_am_on_saturday, 4) == four_am_on_saturday
// dateAtEarlierHour(two_am_on_saturday, 4) == four_am_on_friday
function dateAtEarlierHour (date, starting_hour) {
    var morning = new Date(date.getFullYear(), date.getMonth(), date.getDate(), starting_hour)
    if (date.getHours() < starting_hour) {
        // If it's after midnight, start counting from the previous day's morning
        morning = datePlusMinutes(morning, -60*24)
    }
    return morning
}

function isDateWeekend (date) {
    var day_of_week = date.getDay()
    return (day_of_week == 0 || day_of_week == 6)
}

// Beware the Y2010 bug!  These are the variable holidays:
//   Presidents Day      3rd Monday in February
//   Memorial Day        last Monday in May
//   Labor Day           1st Monday in September
//   Thanksgiving Day    4th Thursday in November

function isDateHoliday (date) {
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()
    
    return (month ==  1 && day ==  1)                   // New Years Day
        || (month ==  2 && day == 18 && year == 2008)   // Presidents Day 2008
        || (month ==  2 && day == 16 && year == 2009)   // Presidents Day 2009
        || (month ==  5 && day == 26 && year == 2008)   // Memorial Day 2008
        || (month ==  5 && day == 25 && year == 2009)   // Memorial Day 2009
        || (month ==  7 && day ==  4)                   // Independence Day
        || (month ==  9 && day ==  1 && year == 2008)   // Labor Day 2008
        || (month ==  9 && day ==  7 && year == 2009)   // Labor Day 2009
        || (month == 11 && day == 27 && year == 2008)   // Thanksgiving 2008
        || (month == 11 && day == 26 && year == 2009)   // Thanksgiving 2009
        || (month == 12 && day == 25)                   // Xmas Day
}
