//-------------------------------------------------------------------------------------
//  UpdateAvailableView.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-------------------------------------------------------------------------------------
//
//  Shows the "Update available" message if an update is available.
//

function UpdateAvailableView (update_available_div, trip_list_help_div) {

    var check_period_hours = 2 * 24   // Check every 2 days.

    var check_version_url = "http://worrydream.com/cgi-bin/bartwidget_check_version?version="
    var homepage_url      = "http://worrydream.com/bartwidget/"

    var date_of_last_check

    function checkForUpdate () {
        var xml_request = new XMLHttpRequest()
        xml_request.onreadystatechange = readyStateChanged

        xml_request.open("GET", check_version_url + bart.version)
        xml_request.setRequestHeader("Cache-Control", "no-cache");
        xml_request.send();

        function readyStateChanged () {
            if (xml_request.readyState != 4) { return }         // Wait until transaction is complete.
            if (xml_request.status != 200) { return }           // Ignore it if it's not "OK".

            date_of_last_check = dateNow()                      // We got through, so remember the date.
            if (/Update to/.test(xml_request.responseText)) {   // Look for the words "Update to".
                showUpdateAvailableText()
            }
        }
    }

    function showUpdateAvailableText () {
        update_available_div.style.visibility = "visible"
        trip_list_help_div.style.visibility = "hidden"     // Help is positioned at the same location.
    }

    // Check when dashboard is opened, and it's been a couple days since the last check.
    bart.listenToEvent("show", null, function () {
        if (date_of_last_check == undefined || 
            getMinutesBetweenDates(date_of_last_check, dateNow()) > 60 * check_period_hours) {
          checkForUpdate()
        }
    })

    // Click on "Update available."    
    bart.listenToEvent("mousedown", update_available_div, function (event) {
        if (window.widget) {
            widget.openURL(homepage_url)
        }
    })
    
}

