//------------------------------------------------------------------------------
//  TitlebarView.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//------------------------------------------------------------------------------
//
//  The TitlebarView class handles the titlebar, which displays the
//  from and to stations and the fare.
//

function TitlebarView (from_span, to_span, fare_span) {

    // Abbreviations for names that are too long to fit.
    var display_names = {
        "North Berkeley": "N Berkeley",
        "South Hayward":  "S Hayward",
        "West Oakland":   "W Oakland"
    }
    
    function getDisplayName (name) {
        return display_names[name] || name
    }

    function updateFare (start_name, end_name) {
        var fare = Fare.getCentsBetween(start_name, end_name)
        var bucks = Math.floor(fare/100)
        var cents = fare % 100
        if (cents < 10) { cents = "0" + cents }
        fare_span.lastChild.nodeValue = "$" + bucks + "." + cents
    }

    bart.listenToEvent("bart_stationChanged", null, function (event) {
        from_span.lastChild.nodeValue = getDisplayName(event.start_station_name)
        to_span.lastChild.nodeValue   = getDisplayName(event.end_station_name)
        updateFare(event.start_station_name, event.end_station_name)
    })
}


