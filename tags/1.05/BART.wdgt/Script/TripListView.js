//------------------------------------------------------------------------------
//  TripListView.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//------------------------------------------------------------------------------
//
//  The TripListView manages drawing and dragging the picture of trains.
//  It listens for a bart_routeChanged event, generates a TripList from
//  the new route, and displays it.
//

function TripListView (canvas, help_div, debug_start_date) {

    //---------------------------------------------------------------
    //  Resources and constants

    // settings
    var mouse_wheel_sensitivity = 1/6  // rows per wheel click

    // colors
    var color_row_stripes       = "#D6EBEF"             // light blue
    var color_timeline_odd      = "#7F7F7F"             // grey
    var color_timeline_even     = "#A0A0A0"             // light grey
    var color_timeline_shadow   = "rgba(0,0,0,0.7)"     // transparent black
    var color_past_shading      = "rgba(0,0,0,0.1)"     // transparent black
    var color_trip_line         = "rgba(80,80,80,0.5)"  // transparent grey
    var alpha_transfer_stations = 0.5
    
    // hardcoded metrics
    var timeline_height   = 15 // px
    var rows_per_canvas   = 4  // Controls vertical zoom.
    var min_pixels_per_minute = 2.5  // Controls horizontal zoom-in.
    var max_pixels_per_minute = 4    // Controls horizontal zoom-out.
    var pixels_from_edge_to_now = 60 // px

    // calculated metrics
    var row_height = (canvas.height - timeline_height) / rows_per_canvas

    // images
    var no_bikes_image = getImage("Images/no_bikes.png")
    var no_trips_image = getImage("Images/no_trips.png")
    

    //---------------------------------------------------------------
    //  TripList management

    var trip_list
    
    var current_route
    var background_action = new BackgroundAction(20) // ms

    bart.listenToEvent("bart_routeChanged", null, function (event) {
        current_route = event.route
        // The first time, reset immediately so we have something to draw.
        if (trip_list == undefined) { reset() }
        else                        { resetInBackground() }
    })

    function reset () {
        trip_list = makeTripList()
        resetPosition()
    }
    
    function resetInBackground () {
        var index
        var new_trip_list
    
        // Calculating the trips for the visible portion of the trip_list
        // takes a little time, and doing it all at once makes dragging
        // map markers feel jerky.  So we pre-calculate one trip at a time,
        // returning to the event loop after each one.  If this function
        // is called again before we're done, the computation is (implicitly)
        // cancelled, which is exactly what we want, because it means that
        // the user has moved onto a different route.

        background_action.set(function () {
            if (new_trip_list == undefined) {
                new_trip_list = makeTripList()
                index = 0
                return true  // Keep going.
            }
            else if (index < rows_per_canvas) {
                new_trip_list.getTripByIndex(index)   // TripList memoizes.
                index++
                return true  // Keep going.
            }
            else {
                trip_list = new_trip_list
                resetPosition()
                return false  // All done.
            }
        })
    }

    function makeTripList () {
        var date_at_index_1 = getStartingDate()
        return new TripList(current_route, date_at_index_1, 1)
    }

    function getStartingDate () {
        return specific_start_date || debug_start_date || dateNow()
    }
    

    //---------------------------------------------------------------
    //  Movin' around.

    var y_of_trip_0
    var leftmost_date
    var date_of_last_drag

    function resetPosition () {
        y_of_trip_0 = timeline_height
        updateHorizontalScale()
        setLeftmostDate(datePlusMinutes(getStartingDate(), -pixels_from_edge_to_now / pixels_per_minute))
        date_of_last_drag = undefined
        draw()
    }
    
    function dragBy (dx,dy) {
        y_of_trip_0 += dy
        setLeftmostDate(datePlusMinutes(leftmost_date, -dx / pixels_per_minute))
        date_of_last_drag = dateNow()
        draw()
    }
    
    function scrollBy (dy) {
        var dy_over_dx = getSlopeOfVisibleTrips()
        var dx = dy / dy_over_dx
        dragBy(dx,dy)
        recenterIfWayOff()
    }
    
    function updateHorizontalScale() {
        var trip = trip_list.getTripByIndex(1)
        var minutes = getMinutesBetweenDates(trip.start_date, trip.end_date)
        var fraction_of_canvas = 0.35 + 0.2 * (minutes / 120)  // Scale so a long trip takes about half the canvas.

        pixels_per_minute = fraction_of_canvas * canvas.width / minutes
        if (pixels_per_minute < min_pixels_per_minute) { pixels_per_minute = min_pixels_per_minute }
        if (pixels_per_minute > max_pixels_per_minute) { pixels_per_minute = max_pixels_per_minute }
    }

    function recenterIfWayOff () {
        var i = getIndexOfFirstVisibleTrip()
        var middle_trip = trip_list.getTripByIndex(i+2)
        var minutes_from_left = getMinutesBetweenDates(leftmost_date, middle_trip.start_date)
        var canvas_minutes = canvas.width / pixels_per_minute
        if (minutes_from_left < canvas_minutes * 1/6 || minutes_from_left > canvas_minutes * 5/6) {
            setLeftmostDate(datePlusMinutes(middle_trip.start_date, -canvas_minutes/2))
            draw()
        }
    }        

    function setLeftmostDate (date) {
        leftmost_date = date
        var now_date = datePlusMinutes(leftmost_date, pixels_from_edge_to_now / pixels_per_minute)
        if (specific_start_date) { specific_start_date = now_date }
        bart.fireEvent( { type: "bart_tripListDateChanged", date:now_date } )
    }
    

    //---------------------------------------------------------------
    //  Canvas management

    function getContext() {
        return canvas.getContext("2d")
    }

    function clearCanvas() {
        var context = getContext()
        context.clearRect(0,0, canvas.width, canvas.height)
    }


    //---------------------------------------------------------------
    //  Top-level drawing

    function draw () {
        clearCanvas()
        if (trip_list == undefined) { return }
        drawTrips()
        drawPastShading()
        drawTimeline()
    }


    //---------------------------------------------------------------
    //  Trip visualization

    function getIndexOfFirstVisibleTrip () {
        return Math.floor((timeline_height - y_of_trip_0) / row_height)
    }

    function getSlopeOfVisibleTrips () {
        var i = getIndexOfFirstVisibleTrip()
        var trip1 = trip_list.getTripByIndex(i+1)
        var trip2 = trip_list.getTripByIndex(i+2)
        var dminutes = getMinutesBetweenDates(trip1.start_date, trip2.start_date)
        var dx = dminutes * pixels_per_minute
        var dy = row_height
        return dy/dx
    }
    

    //---------------------------------------------------------------
    //  Trip drawing

    function drawTrips () {
        var i = getIndexOfFirstVisibleTrip()
        var y = y_of_trip_0 + i * row_height
        for ( ; y < canvas.height ; y += row_height, i++) {
            var trip = trip_list.getTripByIndex(i)
            drawTrip(trip, y, i)
        }
        if (trip.start_station == trip.end_station) { 
            drawNoTrips();
        }
    }

    function drawTrip (trip, y, index) {
        if (index % 2) { drawRowStripe(y) }
        if (trip.start_station == trip.end_station) { return }
        drawTripLine(trip,y)

        var x = drawStartTime(trip, y)
        drawNoBikes(trip, x, y)
        
        var legs = trip.getLegs()
        for (var i=0; i < legs.length; i++) { 
            x = drawTrain(legs[i], x, y)
        }
        x = drawEndTime(trip, x, y)
        drawTransferStations(trip, x, y)
    }

    function drawRowStripe (y) {        // The alternating-row background.
        var context = getContext()
        context.fillStyle = color_row_stripes
        context.fillRect(0, y, canvas.width, row_height)
    }

    function drawTripLine (trip, y) {   // The dark line that connects the transfers.
        var context = getContext()
        var start_x = pixels_per_minute * getMinutesBetweenDates(leftmost_date, trip.start_date) + 3
        var end_x = pixels_per_minute * getMinutesBetweenDates(leftmost_date, trip.end_date) - 3

        if (end_x <= start_x) { return }
        context.fillStyle = color_trip_line
        context.fillRect(start_x, y+14, end_x - start_x, 4)
    }

    function drawTrain (trip, edge_of_prev_train_x, y) {      // Choo-choo!
        var context = getContext()
        var start_x = pixels_per_minute * getMinutesBetweenDates(leftmost_date, trip.start_date)
        if (edge_of_prev_train_x && start_x < edge_of_prev_train_x) { start_x = edge_of_prev_train_x }
        var end_x = pixels_per_minute * getMinutesBetweenDates(leftmost_date, trip.end_date)
        var width = end_x - start_x

        var line_name = trip.alt_line_name || trip.line_name
        var right_edge_of_train_x = DrawTrain.drawTrain(context, line_name, start_x, y + 6, width)
        return right_edge_of_train_x
    }

    function drawNoBikes (trip, start_time_x, y) {
        if (!trip.no_bikes) { return }
        var context = getContext()
        no_bikes_image.draw(context, start_time_x - 24, y + 13)
    }

    function drawNoTrips () {
        var context = getContext()
        no_trips_image.draw(context, 70, 64)
    }

    function drawStartTime (trip, y) {
        var x = 0
        var edge_of_train_x = pixels_per_minute * getMinutesBetweenDates(leftmost_date, trip.start_date)
        function getX (time_string_width) { x = edge_of_train_x - time_string_width - 6;  return x }
        function getOffsetForMinutes () { return 0 }
        drawTime(trip.start_date, y, getX, getOffsetForMinutes)
        return x
    }

    function drawEndTime (trip, edge_of_train_x, y) {
        function getX (time_string_width) { return 6 + edge_of_train_x }
        function getOffsetForMinutes (time_string_width, minutes_string_width) {
            var trip_length = getMinutesBetweenDates(trip.start_date, trip.end_date)
            return (trip_length < 15) ? 0 : time_string_width - minutes_string_width
        }
        return drawTime(trip.end_date, y, getX, getOffsetForMinutes)
    }
    
    function drawTime (date, y, getX, getOffsetForMinutes) {
        var context = getContext()

        var time_string = dateToStringAsHHMM(date)
        var time_string_width = DrawText.getTextWidth(time_string)

        var time_x = getX(time_string_width)
        DrawText.drawText(context, time_string, time_x, y + 10)

        var minutes_from_now = getMinutesBetweenDates(dateNow(), date)
        var minutes_string = getMinutesString(minutes_from_now)
        var minutes_string_width = DrawText.getTextWidth(minutes_string)

        var minutes_x = time_x + getOffsetForMinutes(time_string_width, minutes_string_width)
        return DrawText.drawText(context, minutes_string, minutes_x, y + 23)
    }

    function getMinutesString (minutes) {
        return (minutes >= 60*24*2) ? "in " + Math.round(minutes/60/24)  + " days"
             : (minutes >= 120)     ? "in " + Math.round(minutes/60)     + " hours"
             : (minutes >= 0)       ? "in " + Math.floor(minutes)        + " min"
             : (minutes > -120)     ? ""    + Math.round(-minutes)       + " min ago"
             : (minutes > -60*24*2) ? ""    + Math.round(-minutes/60)    + " hours ago"
             :                        ""    + Math.round(-minutes/60/24) + " days ago"
    }

    function drawTransferStations (trip, edge_of_time_x, y) {
        var station_names = getTransferStationsString(trip)
        if (station_names == "") { return }

        var context = getContext()
        context.save()
        context.globalAlpha = alpha_transfer_stations
        var x = edge_of_time_x + 18
        DrawText.drawText(context, "Transfer at", x, y + 10)
        DrawText.drawText(context, station_names, x, y + 23)
        context.restore()
    }

    function getTransferStationsString (trip) {
        var legs = trip.getLegs()
        var station_names = ""
        for (var i=0; i < legs.length - 1; i++) {
            station_names += (i ? " and " : "") + legs[i].end_station
        }
        return station_names
    }


    //---------------------------------------------------------------
    //  Shades of the past drawing.
    
    function drawPastShading () {
        var context = getContext()
        var x = pixels_per_minute * getMinutesBetweenDates(leftmost_date, dateNow())
        if (x <= 0) { return }
        context.fillStyle = color_past_shading
        context.fillRect(0, 0, x, canvas.height)
    }


    //---------------------------------------------------------------
    //  Timeline drawing.

    function drawTimeline () {
        drawTimelineBackground()
        var date = dateQuantizedDownToMinutes(leftmost_date, 15)
        while (drawTimelineSegment(date) ) {     // Returns true if still on screen.
            date = datePlusMinutes(date, 15)
        }
    }

    function drawTimelineBackground () {
        var context = getContext()
        // We want the timeline to cast a shadow on the trips.
        // The fillRect below is horizontally oversized so the shadow
        // does not round up at the edges.
        context.save()
        context.shadowBlur = 6
        context.shadowColor = color_timeline_shadow
        context.shadowOffsetX = 0
        context.shadowOffsetY = 1
        context.fillStyle = color_timeline_odd
        context.fillRect(-10, 0, canvas.width+20, timeline_height)
        context.restore()
    }

    function drawTimelineSegment (date) {
        var x = pixels_per_minute * getMinutesBetweenDates(leftmost_date, date)
        if (x >= canvas.width) { return false }  // No longer on screen.
        drawTimelineSegmentBackground(date, x)
        drawTimelineSegmentTime(date, x)
        return true                              // Still on screen; try another one.   
    }
    
    function drawTimelineSegmentBackground (date,x) {
        var context = getContext()
        var min = date.getMinutes()
        if (min == 0 || min == 30) { 
            context.fillStyle = color_timeline_even
            context.fillRect(x, 0, pixels_per_minute * 15, timeline_height)
        }
        // The :15 and :45 segments were colored in drawTimelineBackground.
    }
    
    function drawTimelineSegmentTime (date,x) {
        var context = getContext()
        var time_string = dateToStringAsHHMM(date)
        DrawText.drawText(getContext(), time_string, x + 2, 3, "white")
        return true
    }


    //---------------------------------------------------------------
    //  Mouse handling.  Dragging horizontally changes the 
    //  leftmost_date, and dragging vertically changes the 
    //  y_of_trip_0.
    
    var last_x = 0
    var last_y = 0
    var is_dragging = false

    bart.listenToEvent("mousedown", canvas, function (event,x,y) {
        setCurrentMouseDownPosition(x,y)
    })

    bart.listenToEvent("mousemove", canvas, function (event,x,y) {
        if (is_dragging == false) { return }
        dragBy(x - last_x, y - last_y)
        setCurrentMouseDownPosition(x,y)
        removeHelpMessage()
    })

    function stopDragging () { is_dragging = false }
    bart.listenToEvent("mouseup",  canvas, stopDragging)
    bart.listenToEvent("mouseout", canvas, stopDragging)

    bart.listenToEvent("mousewheel", null, function (event) {
        var dy = row_height * event.wheelDelta/120 * mouse_wheel_sensitivity
        scrollBy(dy)
    })
    
    function setCurrentMouseDownPosition (x,y) {
        last_x = x
        last_y = y
        is_dragging = true
    }
    
    bart.listenToEvent("keydown", null, function (event) {
        if (event.target.type && event.target.type == "textarea") { return }
        
        var direction = event.keyCode == 38 ? "up"
                      : event.keyCode == 40 ? "down"
                      :                       undefined
        if (direction == undefined) { return }
        
        // The arrow keys seem to produce two events per keypress, so
        // the magnitude of our dy for each event is row_height/2.
        var dy = row_height/2 * (direction == "down" ? -1 : 1)
        scrollBy(dy)
    })


    //---------------------------------------------------------------
    //  Auto-update.  Normally, we want the display to be at the
    //  "reset" position (leftmost_date is 15 minutes ago, next trip
    //  is on the second row).  But if the user drags the display 
    //  somewhere else, it would be annoying for auto-update to reset
    //  it back.  In that case, we simply redraw (so the current time
    //  advances), but don't reset the position until the user has
    //  left it alone for 10 minutes.

    var autoupdate_time_seconds = 30  // seconds
    var dragged_position_timeout_minutes = 10  // minutes

    var autoupdate_background_action = new BackgroundAction(autoupdate_time_seconds * 1000) // ms

    function update () {
        if (wasCustomPositionSetRecently()) { draw()  } 
        else                                { reset() }
        return true  // So the background action continues.
    }

    function wasCustomPositionSetRecently () {
        return date_of_last_drag && (getMinutesBetweenDates(date_of_last_drag, dateNow())
                                     < dragged_position_timeout_minutes)
    }
    
    function startAutoUpdating () { autoupdate_background_action.set(update) }
    function stopAutoUpdating  () { autoupdate_background_action.cancel()    }

    bart.listenToEvent("show", null, function () { update(); startAutoUpdating() })
    bart.listenToEvent("hide", null, function () { stopAutoUpdating()  })

    startAutoUpdating()


    //---------------------------------------------------------------
    //  Start date from timebar.

    var specific_start_date

    bart.listenToEvent("bart_timebarVisibilityChanged", null, function (event) {
        // When timebar is closed, sync to realtime.
        if (event.show_or_hide == "hide") {
            specific_start_date = undefined
            reset()
        }
    })

    bart.listenToEvent("bart_timebarDateChanged", null, function (event) {
        specific_start_date = event.date
        reset()
    })


    //---------------------------------------------------------------
    //  Help message.  "Drag anywhere to scroll."  Fades out after 
    //  a few seconds, or when the user actually starts dragging.

    var help_display_time_seconds = 8  // seconds
    var help_fadeout_time_seconds = 1  // seconds

    var help_fadeout_ramp = new Ramp( function (v) {
        help_div.style.opacity = 1 - v
        if (v == 1) { help_div.style.visibility = "hidden" }
    })
    help_fadeout_ramp.setTime(help_fadeout_time_seconds * 1000) // ms
    
    function removeHelpMessage () {
        help_fadeout_ramp.setDirection("up")    // Fade it out.
    }
    
    var remove_help_delayed_action = new BackgroundAction(help_display_time_seconds * 1000) // ms
    remove_help_delayed_action.set(removeHelpMessage)

}
