//-----------------------------------------------------------------------------
//  Route.js is part of the BART dashboard widget.      (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  A Route represents a collection of paths between two stations.  A leg is a single
//  path on a single line.  Routes can be combined in parallel (multiple lines between
//  two stations) or in series (a transfer point in the middle).
//
//  Routes are constructed by station.routeTo(other_station).
//  route.getTripAtDate(date) constructs a Trip, which is a specific itinerary.
//
//  start_station = stations.getByName("Del Norte")
//  end_station = stations.getByName("Del Norte")
//  route = start_station.routeTo(end_station)
//
//     route = Route.leg(start_station, end_station, "red_millbrae")
//     route = Route.parallelLegs(start_station, end_station, [ "red_millbrae", "orange_fremont" ])
//     route = Route.parallel(route1, route2)
//     route = Route.series(route1, route2)
//
//  trip = route.getTripStartingAtOrAfter(dateNow())
//  assert(trip.start_date.getTime() >= dateNow().getTime())
//  trip = route.getTripEndingAtOrBefore(dateNow())
//  assert(trip.end_date.getTime() <= dateNow().getTime())
//  trip = route.getTripStartingBefore(dateNow())
//  assert(trip.start_date.getTime() < dateNow().getTime())
//  trip = route.getTripEndingAfter(dateNow())
//  assert(trip.end_date.getTime() > dateNow().getTime())
//
//  The getTripStarting... functions schedule from start to end, and
//  the getTripEnding... functions schedule backwards from end to start.
//
//  TODO: There are still problems with trips having more transfers than necessary,
//  due to the greedy scheduling here.  An example is Fremont to Millbrae at 7:30 
//  on a weekday, which has three legs instead of two, regardless of whether it's
//  scheduled forwards or backwards.
//

Route = {}

//-------------------------------------------------------------------------
//  Series

Route.series = function (route1, route2) {

    if (route1.is_zero_length) { return route2 }
    if (route2.is_zero_length) { return route1 }

    var route = {}

    function makeSeries (leg1,leg2) {
        var series = Trip.series(leg1,leg2)
        series.is_invalid = (leg1.is_invalid || leg2.is_invalid)
        series.is_invalid_all_day = (leg1.is_invalid_all_day || leg2.is_invalid_all_day)
        return series
    }

    route.getTripStartingAtOrAfter = function (date) {
        var leg1 = route1.getTripStartingAtOrAfter(date)
        var leg2 = route2.getTripStartingAtOrAfter(leg1.end_date)
        return makeSeries(leg1,leg2)
    }
    route.getTripEndingAtOrBefore = function (date) {
        var leg2 = route2.getTripEndingAtOrBefore(date)
        var leg1 = route1.getTripEndingAtOrBefore(leg2.start_date)
        return makeSeries(leg1,leg2)
    }
    route.getTripStartingBefore = function (date) {
        var leg1 = route1.getTripStartingBefore(date)
        var leg2 = route2.getTripStartingAtOrAfter(leg1.end_date)
        if (leg2.is_invalid && !leg2.is_invalid_all_day && !leg1.is_invalid) {
            return route.getTripStartingBefore(leg1.start_date)
        }
        return makeSeries(leg1,leg2)
    }
    route.getTripEndingAfter = function (date) {
        var leg2 = route2.getTripEndingAfter(date)
        var leg1 = route1.getTripEndingAtOrBefore(leg2.start_date)
        if (leg1.is_invalid && !leg1.is_invalid_all_day && !leg2.is_invalid) {
            return route.getTripEndingAfter(leg2.end_date)
        }
        return makeSeries(leg1,leg2)
    }
    route.toString = function () {
        return "(series " + route1 + " " + route2 + ")"
    }
    
    return route
}


//-------------------------------------------------------------------------
//  Parallel

Route.parallel = function (route1, route2) {
    var route = {}
    
    function getTrip (date, getTripFuncName, chooseByDate, date_name) {
        var choice1 = route1[getTripFuncName](date)
        var choice2 = route2[getTripFuncName](date)
        return chooseOtherIfInvalid(choice1,choice2)   ||
               chooseOtherIfInvalid(choice2,choice1)   ||
               chooseByDate(choice1,choice2,date_name) || 
               chooseFewestLegs(choice1,choice2)
    }

    function chooseOtherIfInvalid (choice1,choice2) {
        if (choice1.is_invalid) { 
            choice2.is_invalid_all_day = choice1.is_invalid_all_day && choice2.is_invalid_all_day
            return choice2
        }
    }
    function chooseLater (choice1, choice2, date_name) {
        return (choice1[date_name].getTime() > choice2[date_name].getTime()) ? choice1
             : (choice1[date_name].getTime() < choice2[date_name].getTime()) ? choice2
             :                                                                 undefined
    }
    function chooseEarlier (choice1, choice2, date_name) {
        return (choice1[date_name].getTime() < choice2[date_name].getTime()) ? choice1
             : (choice1[date_name].getTime() > choice2[date_name].getTime()) ? choice2
             :                                                                 undefined
    }
    function chooseFewestLegs (choice1,choice2) {
        return (choice1.getLegs().length < choice2.getLegs().length) ? choice1 : choice2
    }

    route.getTripStartingAtOrAfter = function (date) {
        return getTrip(date, "getTripStartingAtOrAfter", chooseEarlier,"end_date")
    }
    route.getTripEndingAtOrBefore = function (date) {
        return getTrip(date, "getTripEndingAtOrBefore", chooseLater,"start_date")
    }
    route.getTripStartingBefore = function (date) {
        return getTrip(date, "getTripStartingBefore", chooseLater,"start_date")
    }
    route.getTripEndingAfter = function (date) {
        return getTrip(date, "getTripEndingAfter", chooseEarlier,"end_date")
    }
    route.toString = function () {
        return "(parallel " + route1 + " " + route2 + ")"
    }
    
    return route
}

Route.parallelLegs = function (start_station, end_station, line_names) {
    var route = Route.leg(start_station, end_station, line_names[0])
    for (var i=1; i < line_names.length; i++) {
        route = Route.parallel(route, Route.leg(start_station, end_station, line_names[i]))
    }
    return route
}


//-------------------------------------------------------------------------
//  Leg

Route.leg = function (start_station, end_station, line_name) {

    var route = {}
    route.is_zero_length = (start_station == end_station)

    //-------------------------------------------------------------------------
    //  Private functions.

    var alt_line_name

    function getTripDates (date, from_station, to_station, 
                           getIndexOfBestInteger, getIndexOfBestNonEqualInteger) {

        function getTimetable (morning) {
            var timetable_name = Holiday.getServiceLevel(morning)
            return timetables[line_name][timetable_name]
        }
    
        // What's today's timetable?
        var morning = dateAtEarlierHour(date, timetables.starting_hour)
        var timetable = getTimetable(morning)
        if (timetable == undefined) { return "invalid all day" }   // Line doesn't run today.
    
        // What are the schedules at the from and to stations?
        var from_schedule = timetable[from_station.name]
        var to_schedule = timetable[to_station.name]
        if (!from_schedule || !to_schedule) { return "invalid all day" }  // Line doesn't stop here today.
    
        // What's the next train to leave the from station?
        var minutes_since_morning = getMinutesBetweenDates(morning, date)
        var train_index = getIndexOfBestInteger(from_schedule, minutes_since_morning)
        if (train_index == undefined) { return "invalid" }        // Missed the last (or first) train.
    
        // When does that train leave?
        var from_minutes = from_schedule[train_index]
        var from_date = datePlusMinutes(morning, from_minutes)
    
        // When does that train arrive at the to station?
        var to_minutes = to_schedule[train_index]
        // Invalid entries in the schedules (non-stops) are marked by non-integers.
        if (!isInteger(to_minutes)) {
            // If the train doesn't stop there, get on the next (or previous) train.
            return getTripDates(from_date, from_station, to_station, 
                                getIndexOfBestNonEqualInteger, getIndexOfBestNonEqualInteger)
        }
        var to_date = datePlusMinutes(morning, to_minutes)

        // Check if bikes are allowed on this trip.
        var no_bikes = false
        var bike_boundaries = timetable.no_bikes && timetable.no_bikes[train_index]
        if (bike_boundaries) {
            var start_no_bikes_minutes = bike_boundaries[0]
            var end_no_bikes_minutes = bike_boundaries[1]
            var bikes_ok = (from_minutes < start_no_bikes_minutes && to_minutes < start_no_bikes_minutes) ||
                           (from_minutes > end_no_bikes_minutes && to_minutes > end_no_bikes_minutes)
            no_bikes = !bikes_ok
        }
        
        // Some lines don't go all the way to the end.  Check if this line has an alt_line_name.
        var getAlternateName = Stations.getNamerForLine(line_name)
        if (getAlternateName) {
            // The namer needs to be able to test whether this train
            // stops at particular stations.
            function doesTrainGoToStation (station_name) {
                var schedule = timetable[station_name]
                return (schedule && isInteger(schedule[train_index]))
            }
            alt_line_name = getAlternateName(doesTrainGoToStation)
        }
        
        return [ from_date, to_date, no_bikes ]
    }

    function makeInvalidTrip (invalid_string) {
        var long_time_from_now = new Date(2030,1,1)
        var trip = Trip.leg(start_station, end_station, 
                            long_time_from_now, long_time_from_now, false, line_name)
        trip.is_invalid = true
        trip.is_invalid_all_day = (invalid_string == "invalid all day")
        return trip
    }

    function getTrip (date, is_routing_backwards, getIndexOfBestInteger, getIndexOfBestNonEqualInteger) {
        var from = is_routing_backwards ? end_station   : start_station
        var to   = is_routing_backwards ? start_station : end_station
        var dates = getTripDates(date, from, to, getIndexOfBestInteger, getIndexOfBestNonEqualInteger)

        if (typeof(dates) == "string") { return makeInvalidTrip(dates) }
        var start_date = dates[ is_routing_backwards ? 1 : 0 ]
        var end_date   = dates[ is_routing_backwards ? 0 : 1 ]
        var no_bikes   = dates[2]
        return Trip.leg(start_station, end_station, start_date, end_date, no_bikes, line_name, alt_line_name)
    }

    //-------------------------------------------------------------------------
    //  Public functions.

    route.getTripStartingBefore = function (date) {
        return getTrip(date, false, getIndexOfSmallerInteger, getIndexOfSmallerInteger)
    }
    route.getTripStartingAtOrAfter = function (date) {
        return getTrip(date, false, getIndexOfLargerOrEqualInteger, getIndexOfLargerInteger)
    }
    route.getTripEndingAtOrBefore = function (date) {
        return getTrip(date, true, getIndexOfSmallerOrEqualInteger, getIndexOfSmallerInteger)
    }
    route.getTripEndingAfter = function (date) {
        return getTrip(date, true, getIndexOfLargerInteger, getIndexOfLargerInteger)
    }
    
    route.toString = function () {
        return "(" + start_station + " to " + end_station + " on " + line_name + ")"
    }
    
    return route
}

