//------------------------------------------------------------------------------
//  TimebarView.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//------------------------------------------------------------------------------
//
//  The TimebarView manages the time/date bar that opens up when the clock
//  button is pressed.  When it is clicked upon, a bart_timebarDateChanged
//  event is sent out, indicating what the TripListView's new date should be.
//  The TripListView normally responds with a bart_tripListDateChanged event
//  (as it does when it scrolls for any reason), and the TimebarView updates
//  its display.

function TimebarView (timeline_div, sun_image, sun_hover_image, date_div,
                      date_left_button, date_right_button) {

    //---------------------------------------------------------------
    //  Constants

    var timeline_x = 41  // px
    var timeline_minutes_per_pixel = 10
    var timeline_width = 20*60 / timeline_minutes_per_pixel  // px
    
    var sun_hover_opacity = 0.5

    //---------------------------------------------------------------
    //  Current date

    var current_date = dateNow()

    bart.listenToEvent("bart_tripListDateChanged", null, function (event) {
        current_date = event.date
        updateDateText(current_date)
        setSunAccordingToDate(current_date)
    })

    function sendDateChangedEvent (date) {
        bart.fireEvent( { type: "bart_timebarDateChanged", date: date } )
    }

    //---------------------------------------------------------------
    //  Sun hover

    var is_sun_hover_visible = false

    function hoverSunAt (x) {
        x = clampSunX(x)
        is_sun_hover_visible = true
        sun_hover_image.style.opacity = sun_hover_opacity
        sun_hover_image.style.left = "" + x + "px"
    }

    function hideSunHover () {
        if (!is_sun_hover_visible) { return }
        is_sun_hover_visible = false
        sun_hover_image.style.opacity = 0
    }

    //---------------------------------------------------------------
    //  Sun

    function moveSunTo (x) {
        x = clampSunX(x)
        sun_image.style.left = "" + x + "px"
    }
    
    function setSunAccordingToDate (date) {
        var morning_date = dateAtEarlierHour(date, 4)
        var minutes_since_morn = getMinutesBetweenDates(morning_date, date)
        var x = timeline_x + (minutes_since_morn / timeline_minutes_per_pixel)
        moveSunTo(x)
    }
    
    function getDateWhenSunIsAt (x) {
        x = clampSunX(x)
        var morning_date = dateAtEarlierHour(current_date, 4)
        var minutes_since_morn = (x - timeline_x) * timeline_minutes_per_pixel
        if (minutes_since_morn < 5) { minutes_since_morn = 5 }
        return datePlusMinutes(morning_date, minutes_since_morn)
    }
    
    function clampSunX (x) {
        if (x < timeline_x) { return timeline_x }
        if (x > timeline_x + timeline_width) { return timeline_x + timeline_width }
        return x
    }

    //---------------------------------------------------------------
    //  Timeline mousing.

    var is_mouse_down = false

    bart.listenToEvent("mousedown", timeline_div, function (event,x,y) { dragTo(x) })
    
    bart.listenToEvent("mousemove", null, function (event,x,y) {
        if (event.target != timeline_div) { stopDragging() }
        else if (is_mouse_down == true)   { dragTo(x)      }
        else                              { hoverSunAt(x)  }
    })

    bart.listenToEvent("mouseout", timeline_div, stopDragging)
    bart.listenToEvent("mouseup", timeline_div, stopDragging)

    function dragTo(x) {
        is_mouse_down = true
        hideSunHover()
        sendDateChangedEvent( getDateWhenSunIsAt(x) )
    }

    function stopDragging () {
        is_mouse_down = false
        hideSunHover()
    }

    //---------------------------------------------------------------
    //  Date prev/next buttons.

    bart.listenToEvent("mousedown", date_left_button, function () {
        sendDateChangedEvent(datePlusMinutes(current_date, -60*24))
    })
    bart.listenToEvent("mousedown", date_right_button, function () {
        sendDateChangedEvent(datePlusMinutes(current_date, 60*24))
    })

    //---------------------------------------------------------------
    //  Date text.

    var month_names = [ "January", "February", "March", "April", "May", "June", "July",
                        "August", "September", "October", "November", "December" ]
    var day_names =   [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
                        "Friday", "Saturday", "Sunday" ]

    function getTextForDate (date) {
        var morning_date = dateAtEarlierHour(date, 4)
        var day_name = day_names[morning_date.getDay()]
        var month_name = month_names[morning_date.getMonth()]
        var day_of_month = morning_date.getDate()
        return day_name + ", " + month_name + " " + day_of_month
    }

    function updateDateText (date) {
        date_div.lastChild.nodeValue = getTextForDate(date)
    }
    
}


//---------------------------------------------------------------
//  The folder-upper handles expanding and hiding the timebar.

function TimebarFolderUpper (timebar_div, lowerbars_div, bottombar_div, belowlowerbars_div, button) {

    var animation_time_ms =     200  // ms
    
    var collapsed_height =      0    // px
    var expanded_height =       16   // px
    var bottombar_height =      29   // px
    
    var event_type = "bart_timebarVisibilityChanged"
    
    function updateHeight (height) {
        timebar_div.style.height = "" + height + "px"
        lowerbars_div.style.height = "" + (bottombar_height + height) + "px"
        bottombar_div.style.top = "" + height + "px"
        belowlowerbars_div.style.top = "" + height + "px"
    }

    var folder_upper = new FolderUpper(collapsed_height, expanded_height, animation_time_ms,
                                       button, event_type, updateHeight)
}

