//-----------------------------------------------------------------------------
//  Test.js is part of the BART dashboard widget.       (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  Somewhat thorough (and very lengthy!) test of the routing and scheduling systems.
//  Run the tests by setting "debug_run_tests" in "Bart.js" to true.
//

function Test () {

    //---------------------------------------------------------
    //  Settings.

    // Verbosity.
    var announce_from_station = true
    var announce_to_station   = true
    var announce_time         = false

    // Narrow down the test.  If undefined, tests all.
    var only_start_name = undefined   // "Del Norte"
    var only_end_name   = undefined   // "Castro Valley"
    var only_date       = undefined   // new Date(2005,5,6, 11,0)


    //---------------------------------------------------------
    //  Testing.

    var num_failures = 0

    // If a widget is on the dashboard, messages go to the system console.
    // In Safari, messages go to the Web Inspector's Error Console.
    function say (message) { 
        console.debug(message) 
    }

    // Why isn't assert built into JavaScript?
    function assert (cond, message) {
        if (cond) { return }
        num_failures++
        say("*** ASSERTION FAILED: " + message)
    }

    // Test from each station to each station.
    this.run = function () {
        var stations = new Stations()

        stations.forEachStation(function (start_station) {
            if (only_start_name && only_start_name != start_station.name) { return }
            if (announce_from_station) { say("Testing from " + start_station + "...") }

            stations.forEachStation(function (end_station) {
                if (only_end_name && only_end_name != end_station.name) { return }
                if (announce_to_station) { say("  Testing to " + end_station + "...") }

                var route = start_station.routeTo(end_station)
                var message = " from " + start_station + " to " + end_station
                testRoute(route, message)
            })
        })
        say(num_failures == 0 ? "Tests passed." : "*** TESTS FAILED.")
    }

    var test_dates_ymd = getTestDatesYMD()
    var test_times_hm = getTestTimesHM()
    
    // Test around several days and several times.
    function testRoute (route, message_in) {
        if (only_date) { 
            testRouteAtDate(route, only_date) 
        }
        else { 
            for (var idate = 0; idate < test_dates_ymd.length; idate++) {
                for (var itime = 0; itime < test_times_hm.length; itime++) {
                    var ymd = test_dates_ymd[idate]
                    var hm = test_times_hm[itime]
                    var date = new Date(ymd[0], ymd[1], ymd[2], hm[0], hm[1])
                    testRouteAtDate(route, date, message_in)
                }   
            }
        }
    }

    // Make sure that the trips are ordered correctly (and, of course,
    // that no exceptions occur.)
    function testRouteAtDate (route, date, message_in) {
        if (announce_time) { say("    Testing at " + date + "...") }

        var trip_list = new TripList(route, date, 0)
        var message = " trip index at " + date + message_in
        
        assert(trip_list.getTripByIndex( 0).start_date.getTime() >= 
                                                  date.getTime(), "now and 0" + message)
        assert(trip_list.getTripByIndex(-1).start_date.getTime() <
                                                  date.getTime(), "now and -1" + message)
        for (var i = -8; i < 8; i++) {
            var this_trip = trip_list.getTripByIndex(i)
            var prev_trip = trip_list.getTripByIndex(i-1)
            assert(this_trip.getMinutes() < 120, "length of " + i + message)
            assert(this_trip.start_date.getTime() > 
                   prev_trip.start_date.getTime(),  "start of " + i + message)
            assert(this_trip.end_date.getTime() > 
                   prev_trip.end_date.getTime(),    "end of " + i + message)
        }
    }
    
    function getTestDatesYMD () {   // Remember that January is 0.
        return [
            [ 2005,5,5  ],   // Sunday
            [ 2005,5,7  ],   // Tuesday
            [ 2005,5,11 ]    // Saturday
        ];
    }

    function getTestTimesHM () {
        return [
            [  1,02 ],
            [  5,02 ],
            [  6,02 ],
            [ 10,02 ],
            [ 12,42 ],
            [ 17,02 ],
            [ 18,02 ],
            [ 20,22 ],
            [ 22,12 ],
            [ 23,02 ]
        ];
    }
}


