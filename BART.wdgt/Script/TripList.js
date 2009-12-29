//-----------------------------------------------------------------------------
//  TripList.js is part of the BART dashboard widget.   (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  A TripList is an infinite collection of Trips for a given Route, 
//  ordered by date and indexed with an integer.  The trips are 
//  computed on an as-needed basis.
//
//  trip_list = new TripList(route, dateNow(), 17)
//  assert( trip_list.getTripByIndex(17).starting_date.getTime() >= dateNow().getTime() )
//  assert( trip_list.getTripByIndex(16).starting_date.getTime() <  dateNow().getTime() )
//
//  trip_stream = new TripStream(route, dateNow())
//  assert( trip_stream.getNextTrip().starting_date.getTime() >= dateNow().getTime() )
//

//---------------------------------------------------------
//  Lazy, memoizing double-ended infinite data structure.
//
//  fives = new LazyDeque(100, function (v) { return v + 5 }, 
//                             function (v) { return v - 5 })
//  assert( fives.get(0)  == 100 )
//  assert( fives.get(1)  == 105 )
//  assert( fives.get(2)  == 110 )
//  assert( fives.get(-1) ==  95 )
//
function LazyDeque (item_0,getPrevious,getNext) {
    var first_index = 0
    var last_index = 0
    var items = {}

    items[0] = item_0

    this.get = function (i) {
        if (i < first_index) {
            items[first_index - 1] = getPrevious(items[first_index])
            first_index--;
            return this.get(i);
            // Unless we have tail-recursion, we have to make sure to not
            // index too far out of the memoized range...
        }
        if (i > last_index) {
            items[last_index + 1] = getNext(items[last_index])
            last_index++;
            return this.get(i);
        }
        return items[i]
    }
}


//---------------------------------------------------------
//  The only tricky thing about Trip List is that there
//  are some "bad" trips that need to be filtered out.
//  Consider these three trips:
//
//    A:   <--------->
//    B:      <------------>
//    C:         <--------->
//  
//  The user should not be shown trip B.  Instead of sitting
//  at MacArthur for a half-hour, he should spend the half-hour
//  with his friends and catch trip C.
//
//  Consider stepping backwards from trip C.
//  route.getTripStartingBefore(trip_c.start_date) will return
//  trip B, because that's the latest trip before that date.
//  But we can see that B isn't as good as C, so we skip it
//  and ask for getTripStartingBefore(trip_b.start_date),
//  which gives trip A.
//
//  Now, consider stepping forwards from trip A.  If we were
//  to use route.getTripStartingAfter(trip_a.start_date), we'd
//  get trip B.  But there'd be no way to know that a better
//  trip is coming up afterwards without explicitly looking ahead.
//  So, instead, we step forwards with 
//  route.getTripEndingAfter(trip_a.end_date).  That will give us
//  trip C, because if the getTrip methods find multiple trips
//  at the same time, they'll return the "best" one.
//
//  Thus, we step backwards with getTripStartingBefore, which
//  schedules forward from a starting date, and we step forwards
//  with getTripEndingAfter, which schedules backward from an
//  ending date.

function TripList (route, starting_date, starting_index) {
    return new TripDataStructure("TripList", route, starting_date, starting_index)
}

function TripStream (route, date, is_end_date) {
    return new TripDataStructure("TripStream", route, date, undefined, is_end_date)
}

//  TripDataStructure can be a TripList or TripStream, depending on
//  its first argument.
function TripDataStructure (type, route, starting_date, starting_index, is_starting_date_end_date) {

    function getTripBeforeDateRange (start_date,end_date) {
        // Go back to a trip with the closest start date.
        var prev_trip = route.getTripStartingBefore(start_date)
        
        // If there are no earlier trips today, wrap back to yesterday.
        if (prev_trip.is_invalid) {
            var this_morning = dateAtEarlierHour(start_date, timetables.starting_hour)
            var prev_evening = datePlusMinutes(this_morning, -1)
            prev_trip = route.getTripStartingBefore(prev_evening)
        }
        
        // We know that this trip starts before the current trip, but
        // make sure it -ends- before the current trip too.
        if (prev_trip.end_date.getTime() >= end_date.getTime()) {
            return getTripBeforeDateRange(prev_trip.start_date, end_date)
        }
        return prev_trip
    }
    
    function getTripAfterDateRange (start_date,end_date) {
        // Go forward to a trip with the closest end date.
        var next_trip = route.getTripEndingAfter(end_date)
        
        // If there are no later trips today, wrap to tomorrow.
        if (next_trip.is_invalid) {
            var this_morning = dateAtEarlierHour(end_date, timetables.starting_hour)
            var next_morning = datePlusMinutes(this_morning, 60*24)
            next_trip = route.getTripEndingAfter(next_morning)
        }
        
        // We know that this trip ends after the current trip, but
        // make sure it -starts- after the current trip too.
        if (next_trip.start_date.getTime() <= start_date.getTime()) {
            return getTripAfterDateRange(start_date, next_trip.end_date)
        }

        // Sometimes routing backwards gives us a trip with more legs than necessary.
        // This band-aid tries routing again from front-to-back, to see if we get a more efficient trip.
        var trip_scheduled_from_beginning = route.getTripStartingAtOrAfter(next_trip.start_date)
        if (!trip_scheduled_from_beginning.is_invalid &&
            trip_scheduled_from_beginning.getLegs().length < next_trip.getLegs().length &&
            trip_scheduled_from_beginning.start_date.getTime() == next_trip.start_date.getTime() &&
            trip_scheduled_from_beginning.end_date.getTime()   == next_trip.end_date.getTime()) {
            return trip_scheduled_from_beginning;
        }

        return next_trip
    }

    function getFirstGoodTripStartingAtOrAfter (date) {
        // Get first trip after date, scheduled from start to end.
        var trip = route.getTripStartingAtOrAfter(date)
        // If there are no more trips today, get the first one tomorrow.
        if (trip.is_invalid) { return getTripAfterDateRange(date,date) }

        // Schedule the trip from end back to start, and see if we come up with the same thing.
        var trip_scheduled_from_end = route.getTripEndingAtOrBefore(trip.end_date)
        // If there is a later trip that arrives at or before this one, we skip this one.
        if (trip.start_date.getTime() < trip_scheduled_from_end.start_date.getTime()) {
            return getFirstGoodTripStartingAtOrAfter(datePlusMinutes(trip.start_date, 1))
        }
        return trip
    }
    
    function getFirstGoodTripEndingAfter (date) {
        // Get first trip after date, scheduled from end to start.
        var trip = route.getTripEndingAfter(date)
        // If there are no more trips today, get the first one tomorrow.
        if (trip.is_invalid) { return getTripAfterDateRange(date,date) }

        // Schedule the trip from start back to end, and see if we come up with the same thing.
        var trip_scheduled_from_start = route.getTripStartingAtOrAfter(trip.start_date)
        // If there is a later trip that departs at or before this one, we skip this one.
        if (trip.end_date.getTime() > trip_scheduled_from_start.end_date.getTime()) {
            return getFirstGoodTripEndingAfter(datePlusMinutes(trip.end_date, 1))
        }
        return trip
    }
        
    function getPreviousTrip (trip) {
        return getTripBeforeDateRange(trip.start_date, trip.end_date)
    }
    function getNextTrip (trip) {
        return getTripAfterDateRange(trip.start_date, trip.end_date)
    }

    var starting_trip = is_starting_date_end_date ? getFirstGoodTripEndingAfter(starting_date)
                                                  : getFirstGoodTripStartingAtOrAfter(starting_date)
    
    if (type == "TripList") {
        var deque = new LazyDeque(starting_trip, getPreviousTrip, getNextTrip)
        this.getTripByIndex = function (i) { return deque.get(i - starting_index) }
    }
    if (type == "TripStream") {
        this.getNextTrip = function () {
            var this_trip = starting_trip
            starting_trip = getNextTrip(starting_trip)
            return this_trip
        }
    }
}


