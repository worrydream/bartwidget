//------------------------------------------------------------------------------
//  SpeakingView.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//------------------------------------------------------------------------------
//
//  Announces when the next train is arriving, or when a bookmarked trip is
//  coming up.
//
//  Credits go to my friend and BART enthusiast Andy Likuski for the 
//  clarified pronunciations.
//

function SpeakingView (small_speech_bubble_view, announce_button) {

    //---------------------------------------------------------------
    //  Settings.

    var speak_time_seconds = 6  // seconds that it takes to say a typical announcement.
    var voice_name = "Vicki"

    var speak_interval_minutes = 5  // minutes
    var check_announcement_interval_minutes = 1  // minutes


    //---------------------------------------------------------------
    //  Checking announcements.

    var check_background_action = new BackgroundAction(check_announcement_interval_minutes * 60 * 1000)
    var announcements = {}

    function checkAnnouncements () {
        for (var key in announcements) { announcements[key].check() }
        return true  // continue background action
    }

    function startAnnouncing () { check_background_action.set(checkAnnouncements) }
    function stopAnnouncing  () { check_background_action.cancel() }


    //---------------------------------------------------------------
    //  Current route.

    var speak_current_route_parameters = {
        speech_active_current:  bart.retrievePropertyOrDefault("speech_active_current", 0),
        speech_advance_current: bart.retrievePropertyOrDefault("speech_advance_current", 10),
        start: "",
        end: ""
    }
    
    function storeCurrentRouteParameters () {
        bart.storeProperty("speech_active_current", speak_current_route_parameters.speech_active_current)
        bart.storeProperty("speech_advance_current", speak_current_route_parameters.speech_advance_current)
    }

    bart.listenToEvent("bart_stationChanged", null, function (event) {
        speak_current_route_parameters.start = event.start_station_name
        speak_current_route_parameters.end = event.end_station_name
        addOrRemoveAnnouncement(speak_current_route_parameters, "current")
    })

    bart.listenToEvent("mousedown", announce_button, function () {
        small_speech_bubble_view.displayParameters(speak_current_route_parameters)
    })


    //---------------------------------------------------------------
    //  Announcement-related event listeners.

    bart.listenToEvent("bart_bookmarkAdded", null, function (event) {
        if (event.parameters.speech_active_fwd) { addAnnouncement(event.parameters, "fwd") }
        if (event.parameters.speech_active_rev) { addAnnouncement(event.parameters, "rev") }
    })

    bart.listenToEvent("bart_bookmarkRemoved", null, function (event) {
        removeAnnouncement(event.parameters, "fwd")
        removeAnnouncement(event.parameters, "rev")
    })

    bart.listenToEvent("bart_speechParamChanged", null, function (event) {
        var parameters = event.parameters
        if (event.direction == "current") {
            parameters = speak_current_route_parameters
            parameters.speech_active_current = event.parameters.speech_active_current
            parameters.speech_advance_current = event.parameters.speech_advance_current
            storeCurrentRouteParameters()
            if (parameters.start == "" || parameters.end == "") { return }
        }
        addOrRemoveAnnouncement(parameters, event.direction)
    })


    //---------------------------------------------------------------
    //  Adding and removing announcements.

    function addOrRemoveAnnouncement (parameters, direction) {
        var func = parameters["speech_active_" + direction] ? addAnnouncement : removeAnnouncement
        func(parameters, direction)
    }

    function addAnnouncement (parameters, direction) {
        var key = getAnnouncementKeyFromParameters(parameters, direction)
        if (isObjectEmpty(announcements)) { startAnnouncing() }
        announcements[key] = new Announcement(parameters, direction)
    }
    
    function removeAnnouncement (parameters, direction) {
        var key = getAnnouncementKeyFromParameters(parameters, direction)
        delete announcements[key] 
        if (isObjectEmpty(announcements)) { stopAnnouncing() }
    }

    function getAnnouncementKeyFromParameters (parameters, direction) {
        return (direction == "current") ? "current"
             : (direction == "rev")     ? parameters.end   + ", " + parameters.start
             :                            parameters.start + ", " + parameters.end
    }


    //---------------------------------------------------------------
    //  Announcement class.
    
    function Announcement (parameters, direction) {
        
        var start = bart.stations.getByName(direction == "rev" ? parameters.end   : parameters.start)
        var end =   bart.stations.getByName(direction == "rev" ? parameters.start : parameters.end)
        var route = start.routeTo(end)

        var minutes_in_advance = parameters["speech_advance_" + direction]
        var is_advance_before_arrival = parameters["speech_arrival_" + direction]
        var is_weekdays_only = parameters["speech_weekday_" + direction]
        var is_checking_end_date_in_window = parameters["speech_arriving_" + direction]

        var start_or_end_date_for_advance = is_advance_before_arrival ? "end_date" : "start_date"
        
        var trip_stream = makeTripStream()
        var next_trip = trip_stream.getNextTrip()
        
        function makeTripStream () {
            return new TripStream(route, datePlusMinutes(dateNow(), minutes_in_advance), is_advance_before_arrival)
        }
        
        // announcement.check() is called every minute by checkAnnouncements().
        this.check = function () {

            var minutes_until_next_trip = 
                    (next_trip[start_or_end_date_for_advance].getTime() - dateNow().getTime()) / (60 * 1000)
            
            // If it's not yet time to check the next trip, ignore.
            if (minutes_until_next_trip > minutes_in_advance + 1) { return }
            
            // If we overshot the next trip by more than a few minutes, then we probably were put
            // to sleep.  Reinitialize the trip stream around the current time.
            if (minutes_until_next_trip < minutes_in_advance - 3) {
                trip_stream = makeTripStream()
            }
            else {
                if (shouldTripBeAnnounced(next_trip)) { speakTrip(next_trip, start_or_end_date_for_advance) }
            }

            // Advance the stream.
            next_trip = trip_stream.getNextTrip()
        }

        function shouldTripBeAnnounced (trip) {
        
            // The "current" announcement is unconditional.
            if (direction == "current") { return true }
        
            // Ignore if it's the weekend, and we're only interested in weekdays.
            var morning = dateAtEarlierHour(trip.start_date, timetables.starting_hour)
            if (is_weekdays_only && isDateWeekend(morning)) { return false }
          
            // Check whether the target falls into the specified time window.
            var window_start_date = getDateFromMinutesSinceMidnight(parameters["speech_start_time_" + direction])
            var window_end_date   = getDateFromMinutesSinceMidnight(parameters["speech_end_time_" + direction])
            var target_date       = is_checking_end_date_in_window ? trip.end_date : trip.start_date

            var is_within_time_window = ( target_date.getTime() >= window_start_date.getTime() &&
                                          target_date.getTime() <= window_end_date.getTime() )
            return is_within_time_window
            
            function getDateFromMinutesSinceMidnight (time) {
                var minutes_since_morn = time - timetables.starting_hour * 60
                if (minutes_since_morn < 0) { minutes_since_morn += 24 * 60 }
                return datePlusMinutes(morning, minutes_since_morn)
            }
        }
    }

    //---------------------------------------------------------------
    //  Speaking.

    var pronunciations = getPronunciations()
    var speaking_background_queue = new BackgroundQueue()

    function speakTrip (trip, start_or_end_date) {
        var minutes = Math.floor(getMinutesBetweenDates(dateNow(), trip[start_or_end_date]))
        var minutes_string = (minutes >  1) ? " in " + minutes + " minutes"
                           : (minutes == 1) ? " in 1 minute"
                           :                  " in less than 1 minute"

        var start_station = pronunciations[trip.start_station] || trip.start_station
        var end_station = pronunciations[trip.end_station] || trip.end_station
        var sentence = ((start_or_end_date == "end_date") ? "Train from " + start_station + " arriving at "
                                                          : "Train departing " + start_station + " for ")
                       + end_station + minutes_string

        speakString(sentence)
    }

    // We run strings to be spoken through a BackgroundQueue, so we don't hear them
    // spoken on top of one other if we try to speak more than one at a time.
    function speakString (string) {
        if ( ! window.widget) { return }
        speaking_background_queue.add(speak_time_seconds * 1000, function () {
            var execute_asynchronously = nullFunc
            widget.system("say -v " + voice_name + " '" + string + "'", execute_asynchronously)
        })
    }


    //---------------------------------------------------------------
    //  Clarified pronunciations.
    
    function getPronunciations () {
        return {
            "Del Norte":        "El Cerrito Del Norte",
            "Plaza":            "El Cerrito Plaza",
            "Pleasant Hill":    "Pleasant Hill Contra Costa Center",
            "Pittsburg":        "Pittsburg Bay Point",
            "19th St":          "Nineteenth Street Oakland",
            "12th St":          "Twelfth Street Oakland City Center",
            "16th St":          "Sixteenth Street Mission",
            "24th St":          "Twenty Fourth Street Mission",
            "South SF":         "South San Francisco",
            "SFO":              "San Francisco Airport",
            "Coliseum":         "Coliseum Oakland Airport",
            "San Leandro":      "San Lee Andro",
            "West Dublin":      "West Dublin Pleasanton",
            "Dublin":           "Dublin Pleasanton"
        }
    }

}
