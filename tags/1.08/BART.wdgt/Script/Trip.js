//-----------------------------------------------------------------------------
//  Trip.js is part of the BART dashboard widget.       (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  A Trip represents a scheduled Route -- a path from one station to another
//  at a particular time and on particular lines.
//
//  trip = route.getTripStartingBefore(dateNow())
//
//    trip = Trip.leg(start_station, end_station, start_date, end_date, no_bikes, line_name)
//    trip = Trip.series(trip1, trip2)
//
//  trips = trip.getLegs()    // trips is array of one-leg trips
//  length_of_trip = trip.getMinutes()
//
//  Public properties:
//
//    trip.start_station  == stations.getByName("Del Norte")
//    trip.end_station    == stations.getByName("Berkeley")
//    trip.start_date     == dateNow()
//    trip.end_date       == datePlusMinutes(dateNow(), 10)
//    trip.no_bikes       == true
//    trip.line_name      == "red_richmond"     // if leg
//

function Trip (start_station, end_station, start_date, end_date, no_bikes, line_name, alt_line_name) {

    this.start_station = start_station
    this.end_station = end_station
    this.start_date = start_date
    this.end_date = end_date
    this.line_name = line_name
    this.alt_line_name = alt_line_name
    this.no_bikes = no_bikes
    
    this.getMinutes = function () { return getMinutesBetweenDates(start_date,end_date) }
    this.getLegs = function () { return [ this ] }
    this.toString = function () {
        return "(" + start_station + " at " + start_date +
            " to " + end_station +   " at " + end_date +
                                     " on " + line_name + ")"
    }
}

Trip.leg = function (start_station, end_station, start_date, end_date, no_bikes, line_name, alt_line_name) {
    return new Trip (start_station, end_station, start_date, end_date, no_bikes, line_name, alt_line_name) 
}

Trip.series = function (trip1, trip2) {

    // Consolidate adjacent legs that are actually the same train.  (No transfer required.)
    function consolidateLegs (legs) {
        var consolidated_legs = []
        var last_consolidated_leg
        for (var i=0; i < legs.length; i++) {
            var leg = legs[i]
            if (last_consolidated_leg && last_consolidated_leg.line_name == leg.line_name) {
                leg = new Trip(last_consolidated_leg.start_station, leg.end_station, 
                               last_consolidated_leg.start_date,    leg.end_date,
                               last_consolidated_leg.no_bikes || leg.no_bikes,
                               leg.line_name, leg.alt_line_name)
                consolidated_legs.pop()
            }
            consolidated_legs.push(leg)
            last_consolidated_leg = leg
        }
        return consolidated_legs
    }

    var trip = new Trip (trip1.start_station, trip2.end_station, trip1.start_date, trip2.end_date,
                         trip1.no_bikes || trip2.no_bikes, trip1.line_name, trip1.alt_line_name)

    var legs_from_both_trips = trip1.getLegs().concat(trip2.getLegs())
    var legs = consolidateLegs(legs_from_both_trips)

    trip.getLegs = function () { return legs }
    trip.toString = function () { return "(" + legs.join(', ') + ")" }
    return trip
}

