//--------------------------------------------------------------------------------
//  MapView.js is part of the BART dashboard widget.    (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//--------------------------------------------------------------------------------
//
//  The MapView manages drawing the system map and dragging the station markers.
//  When one of the markers is set to a new station, a bart_stationChanged event
//  is fired.
//

function MapView (canvas, reverse_route_button, google_map_button, bookmark_button) {


    //---------------------------------------------------------------
    //  Resources and constants

    // settings
    var zoom_sensitivity   = 2    // Magic number!
    var full_zoom_distance = 100  // map px

    var lock_key  = " "           // spacebar
    var lock_zoom = 2             // canvas px per map px
    var lock_border_width  = 10   // px
    var lock_border_height = 10   // px

    // colors
    var color_from_line       = "rgba(0,255,0,0.7)"  // green
    var color_to_line         = "rgba(255,0,0,0.7)"  // red
    var color_lock_border     = "rgba(0,0,0,0.5)"    // transparent black

    var alpha_titlebar_shadow = 0.7
    var alpha_line_shadow     = 0.5
    var alpha_dragging_marker = 0.45
    var alpha_help            = 0.8
    
    // to_from image
    var to_from_image = getImage("Images/to_from.png")

    // to_from image metrics
    var marker_image_width    = 55  // px
    var marker_image_height   = 55  // px
    var marker_image_center_x = 27  // px
    var marker_image_center_y = 26  // px
    var marker_radius         = 24  // px
    var from_image_x          = 60  // px

    // help image
    var help_image = getImage("Images/map_help.png")

    // opener image
    var opener_image = getImage("Images/mapbar_opener.png")
    var opener_image_width  = 34  // px
    var opener_image_height = 34  // px


    //---------------------------------------------------------------
    //  Map management

    var map

    var previous_map
    var drawPreviousMapImage = function () {}
    var map_transition_amount = 1

    var map_transition_ramp = new Ramp (function (v) { map_transition_amount = v;  draw() })

    bart.listenToEvent("bart_mapChanged", null, function (event) {
        drawPreviousMapImage = getCurrentDrawMapImage()
        previous_map = map
        
        map = event.map
        map_transition_ramp.setOutput(0)
        map_transition_ramp.setDirection("up")
        
        var restoreStartMarker = start_marker.getRestoreCanvasPosition()
        var restoreEndMarker = end_marker.getRestoreCanvasPosition()
        rescaleMap()
        restoreStartMarker()
        restoreEndMarker()
    })


    //---------------------------------------------------------------
    //  Marker variables.

    var start_marker = makeMarker("start", "Del Norte",     300, 100)  // Defaults.
    var end_marker   = makeMarker("end",   "Castro Valley", 500, 350)  // Defaults.

    var dragging_marker


    //---------------------------------------------------------------
    //  Marker class.

    function makeMarker (start_or_end, default_name, default_x, default_y) {
        var name = bart.retrievePropertyOrDefault(start_or_end + "_name", default_name)
        var x    = bart.retrievePropertyOrDefault(start_or_end + "_x",    default_x)
        var y    = bart.retrievePropertyOrDefault(start_or_end + "_y",    default_y)
        return new Marker (name, x, y)
    }

    function Marker (station_name, x, y) {  // x and y are relative to map, not canvas.

        //---------------------------------------------------------------
        //  Drawing.

        var shrunken_size = 1
        var shrink_ramp = new Ramp(function (v) { shrunken_size = (3 + 7*v) / 10;  draw() })
        shrink_ramp.setOutput(1)
        shrink_ramp.setTime(100)  // ms
        
        this.drawMarker = function () {
            // Draw the opaque marker.
            drawMarkerImage(1, shrunken_size, (this == start_marker))
        }

        this.drawLineToStation = function () {
            // Draw the translucent under-marker, if shrunken.
            if (shrunken_size < 1) {
                drawMarkerImage(alpha_dragging_marker, 1, (this == start_marker))
            }

            var context = getContext()
            context.save()

            var marker_x  = getCanvasXFromMapX(x)
            var marker_y  = getCanvasYFromMapY(y)
            var station_x = getCanvasXFromMapX(map.stations[station_name].x)
            var station_y = getCanvasYFromMapY(map.stations[station_name].y)
            if (map_transition_amount < 1) {
                station_x = map_transition_amount * station_x + 
                       (1 - map_transition_amount) * getCanvasXFromMapX(previous_map.stations[station_name].x)
                station_y = map_transition_amount * station_y + 
                       (1 - map_transition_amount) * getCanvasYFromMapY(previous_map.stations[station_name].y)
            }
            
            setContextShadow(context, alpha_line_shadow, 4, 3)
            context.strokeStyle = (this == start_marker) ? color_from_line : color_to_line
            context.lineCap = "round"
            context.lineWidth = 6
            
            context.beginPath();
            context.moveTo(marker_x,marker_y)
            context.lineTo(station_x,station_y)
            context.stroke()
            
            context.restore()
        }

        function drawMarkerImage (alpha, size, is_start_marker) {
            var context = getContext()
            context.save()
            context.globalAlpha = alpha

            // Choose whether to draw the "from" or "to" image.
            var src_x = is_start_marker ? from_image_x : 0

            // Figure out where on the canvas to draw to.
            var dst_x = getCanvasXFromMapX(x) - Math.floor(size * marker_image_width/2)
            var dst_y = getCanvasYFromMapY(y) - Math.floor(size * marker_image_height/2)
            var size_x = Math.floor(marker_image_width * size)
            var size_y = Math.floor(marker_image_height * size)

            to_from_image.draw(context,
                               src_x,     0, marker_image_width, marker_image_height,
                               dst_x, dst_y, size_x,             size_y)
            context.restore()
        }
        

        //---------------------------------------------------------------
        //  Locking.

        var is_locked = false
        var is_transitioning = false
        
        var rescaleLockedMap = function (v) { }
        
        function generateRescaleLockedMap () {
            var old_zoom = canvas_pixels_per_map_pixel
            var canvas_x = getCanvasXFromMapX(x)
            var canvas_y = getCanvasYFromMapY(y)
            return function (v) {
                var zoom = (1-v) * old_zoom + v * lock_zoom
                setCanvasPixelsPerMapPixel(zoom)
                window_position_x = x - canvas_x / zoom
                window_position_y = y - canvas_y / zoom
            }
        }

        var lock_ramp = new Ramp(function (v) { 
            is_transitioning = (v != 0 && v != 1)
            rescaleLockedMap(v)
            lock_border_opacity = v
            draw()
        })
        
        this.lock = function () {
            is_locked = true
            rescaleLockedMap = generateRescaleLockedMap()
            lock_ramp.setDirection("up")
            lock_ramp.update()
        }

        this.unlock = function () {
            is_locked = false
            rescaleMap()
            moveToCanvasCoordinates(getCanvasXFromMapX(x), getCanvasYFromMapY(y))
            rescaleLockedMap = generateRescaleLockedMap()
            lock_ramp.setDirection("down")
            lock_ramp.update()
        }
        
        
        //---------------------------------------------------------------
        // Moving.  When we drag a marker, we expect it to follow our mouse's movement
        // on the canvas.  But canvas position is a function of both markers' map
        // positions, and because of all the crazy zooming and panning going on,
        // that function is not easily reversible.  We can move the marker's map
        // location according to the current map/canvas translation, but then
        // when the zoom and pan are updated, the marker is no longer at the
        // right canvas position.  But!  If we do that several times in a row,
        // it will eventually converge to the right canvas position, or close enough.
        
        var num_drag_convergence_iterations = 8
        
        var drag_offset_dx, drag_offset_dy
        
        this.downAt = function (canvas_x, canvas_y) {
            shrink_ramp.setDirection("down")
            drag_offset_dx = getCanvasXFromMapX(x) - canvas_x
            drag_offset_dy = getCanvasYFromMapY(y) - canvas_y
        }
        
        this.up = function () {
            shrink_ramp.setDirection("up")
        }

        this.dragTo = function (canvas_x, canvas_y) {
            if (is_transitioning) { return }    // Can't drag while locking/unlocking.
            moveToCanvasCoordinates(canvas_x + drag_offset_dx, canvas_y + drag_offset_dy)
            updateStationName()
            draw()
            this.savePosition()
        }

        this.savePosition = function () {
            var start_or_end = (this == start_marker) ? "start" : "end"
            bart.storeProperty(start_or_end + "_name", station_name)
            bart.storeProperty(start_or_end + "_x", x)
            bart.storeProperty(start_or_end + "_y", y)
        }

        function moveToCanvasCoordinates (canvas_x, canvas_y) {
            for (var i = 0; i < num_drag_convergence_iterations; i++) {
                x = clampCoordinate(getMapXFromCanvasX(canvas_x), map.width)
                y = clampCoordinate(getMapYFromCanvasY(canvas_y), map.height)
                if (is_locked) { break }    // Don't rescale if locked.
                rescaleMap()
            }
        }
   
        function updateStationName () {
            var closest_station_name = getNameOfClosestStation(x,y)
            if (station_name != closest_station_name) { 
                station_name = closest_station_name
                stationsChanged() 
            }
        }

        function clampCoordinate (v, max) {
            if (v < 0) { return 0 }
            if (v > max) { return max }
            return v
        }


        //---------------------------------------------------------------
        //  Parameter object.
        
        this.storeParametersInObject = function (parameters) { 
            var start_or_end = (this == start_marker) ? "start" : "end"
            parameters[start_or_end + "x"] = Math.round(x)
            parameters[start_or_end + "y"] = Math.round(y)
            parameters[start_or_end] = station_name
        }

        this.restoreParametersFromObject = function (parameters) {
            var start_or_end = (this == start_marker) ? "start" : "end"
            x = clampCoordinate(1 * (parameters[start_or_end + "x"] || 0), map.width)
            y = clampCoordinate(1 * (parameters[start_or_end + "y"] || 0), map.height)
            rescaleMap()
            
            var name = parameters[start_or_end] || ""
            if (name != station_name && map.stations[name]) {
                station_name = name
                stationsChanged()
            }
            this.savePosition()
        }


        //---------------------------------------------------------------
        // Queries.
        
        this.isAt = function (canvas_x, canvas_y) {
            var dx = getCanvasXFromMapX(x) - canvas_x
            var dy = getCanvasYFromMapY(y) - canvas_y
            return (dx*dx + dy*dy < marker_radius*marker_radius)
        }

        this.getRestoreCanvasPosition = function () {
            var canvas_x = getCanvasXFromMapX(x)
            var canvas_y = getCanvasYFromMapY(y)
            return function () { 
                x = clampCoordinate(getMapXFromCanvasX(canvas_x), map.width)
                y = clampCoordinate(getMapYFromCanvasY(canvas_y), map.height)
            }
        }
        
        this.getX = function () { return x }
        this.getY = function () { return y }
        this.getStationName = function () { return station_name }
    }


    //---------------------------------------------------------------
    //  MapView initialization.

    function initialize () {
        rescaleMap()
        draw()
        stationsChanged()
    }


    //---------------------------------------------------------------
    //  Coordinate translation.

    // Zoom.
    var canvas_pixels_per_map_pixel
    var window_width
    var window_height

    // Pan.
    var window_position_x
    var window_position_y

    function setCanvasPixelsPerMapPixel (v) {
        var minimum = canvas.width / map.width
        if (v < minimum) { v = minimum }
    
        canvas_pixels_per_map_pixel = v
        window_width  = canvas.width / canvas_pixels_per_map_pixel
        window_height = canvas.height / canvas_pixels_per_map_pixel
    }
    
    function getCanvasXFromMapX (map_x) { 
        return (map_x - window_position_x) * canvas_pixels_per_map_pixel 
    }
    function getCanvasYFromMapY (map_y) { 
        return (map_y - window_position_y) * canvas_pixels_per_map_pixel 
    }
    function getMapXFromCanvasX (canvas_x) {
        return canvas_x / canvas_pixels_per_map_pixel + window_position_x
    }
    function getMapYFromCanvasY (canvas_y) {
        return canvas_y / canvas_pixels_per_map_pixel + window_position_y
    }


    //---------------------------------------------------------------
    //  Map rescaling.

    function rescaleMap () {
        if ( ! map.isZoomable) { return rescaleUnzoomableMap() }
    
        var distance = getDistanceBetweenMarkers()
        var zoom = calculateZoomFromDistance(distance)
        setCanvasPixelsPerMapPixel(zoom)

        var center_x = getAverageCoordinate("getX")
        window_position_x = calculateWindowPositionCoordinate(center_x, window_width,  map.width)

        var center_y = getAverageCoordinate("getY")
        window_position_y = calculateWindowPositionCoordinate(center_y, window_height, map.height)
    }

    function rescaleUnzoomableMap () {
        setCanvasPixelsPerMapPixel(0)   // Will be clipped to minimum.
        window_position_x = 0
        window_position_y = 0
    }

    function calculateZoomFromDistance (distance_between_markers) {
        // This is where the magic happens.
        var smaller_distance = distance_between_markers - full_zoom_distance
        if (smaller_distance < 0) { smaller_distance = 0 }
        var q = zoom_sensitivity * (smaller_distance / map.width)
        return 1 / (1 + q)
    }

    function getAverageCoordinate (getFuncName) {
        var start = start_marker[getFuncName]()
        var end   = end_marker[getFuncName]()
        return (start + end) / 2
    }
    
    function getDistanceBetweenMarkers () {
        var dx = start_marker.getX() - end_marker.getX()
        var dy = start_marker.getY() - end_marker.getY()
        return Math.sqrt(dx*dx + dy*dy)
    }

    function calculateWindowPositionCoordinate(center_of_mass, window_size, map_size) {
        var window_position = Math.floor(center_of_mass - window_size/2)
        if (window_position < 0) { window_position = 0 }
        if (window_position + window_size > map_size) { window_position = map_size - window_size }
        return window_position
    }


    //---------------------------------------------------------------
    //  Map bar support.

    var mapbar_open_amount = 0
    var canvas_offset_dy = 0
    
    var mapbar_view = new MapbarView(canvas)
    var mapbar_height = mapbar_view.getHeight()
    map = mapbar_view.getActiveMap()

    var mapbar_open_ramp = new Ramp (function (v) { 
        mapbar_open_amount = v
        canvas_offset_dy = Math.round(v * mapbar_height)
        draw() 
    })
    mapbar_open_ramp.setTime(300)

    function isMapbarOpenerAt (x,y) {
        return x < opener_image_width && y > canvas.height - opener_image_height
    }
    

    //---------------------------------------------------------------
    //  Defer drawing during a ramp tick.

    var is_in_ramp_tick = false
    var is_draw_deferred = false
    
    bart.listenToEvent("bart_rampBeginTick", null, function () {
        is_in_ramp_tick = true
    })
    
    bart.listenToEvent("bart_rampEndTick", null, function () {
        is_in_ramp_tick = false
        if (is_draw_deferred) { draw() }  // Draw for reals when the tick ends.
    })

    
    //---------------------------------------------------------------
    //  Drawing.

    var lock_border_opacity = 0
    var help_opacity = 0

    function draw () {
        is_draw_deferred = is_in_ramp_tick
        if (is_draw_deferred) { return }
    
        var context = getContext()

        if (mapbar_open_amount > 0) {
            context.save()
            context.translate(0, canvas.height - mapbar_height)
            mapbar_view.draw(context, mapbar_open_amount)
            context.restore()
        }
        
        context.save()
        context.translate(0, -canvas_offset_dy)
        
        drawMapImages()
        start_marker.drawLineToStation()
        end_marker.drawLineToStation()
        drawMapbarOpener()
        start_marker.drawMarker()
        end_marker.drawMarker()
        drawLockBorder()
        drawHelp()

        context.restore()
        drawTitlebarShadow()
    }

    function getContext() {
        return canvas.getContext("2d")
    }

    function drawMapImages () {
        var context = getContext()
        context.save()
        if (mapbar_open_amount > 0) { setContextShadow(context, 0.5, 5, 2) }
        drawPartOfImageToEntireCanvas(context, map.image, 
                                      window_position_x, window_position_y, window_width, window_height)
        context.restore()

        if (map_transition_amount < 1) {
            context.save()
            context.globalAlpha = 1 - map_transition_amount
            drawPreviousMapImage(context)
            context.restore()
        }
    }

    function getCurrentDrawMapImage () {
        var x = window_position_x
        var y = window_position_y
        var w = window_width
        var h = window_height
        var image = map.image
        return function (context) { drawPartOfImageToEntireCanvas(context, image, x,y, w,h) }
    }
    
    function drawPartOfImageToEntireCanvas (context,image,x,y,w,h) {
        image.draw(context, x, y, w, h,
                            0, 0, canvas.width, canvas.height)
    }

    function drawLockBorder() {
        if (lock_border_opacity == 0) { return }
        var context = getContext()
        context.save()
        context.globalAlpha = lock_border_opacity
        context.fillStyle = color_lock_border
        context.rect(0, 0, lock_border_width, canvas.height)  // top
        context.rect(0, 0, canvas.width, lock_border_height)  // left
        context.rect(0, canvas.height - lock_border_height, canvas.width, lock_border_height)  // bottom
        context.rect(canvas.width - lock_border_width, 0,   lock_border_width, canvas.height)  // right
        context.fill()
        context.restore()
    }

    function drawTitlebarShadow() {
        var context = getContext()
        context.save()
        setContextShadow(context, alpha_titlebar_shadow, 6, 1)
        context.fillStyle = "#ffffff"   // color doesn't matter (not visible)
        context.fillRect(-10, -10, canvas.width+20, 10)
        context.restore()
    }
    
    function drawHelp() {
        if (help_opacity == 0) { return }
        if ( ! map.isZoomable) { return }
        var context = getContext()
        context.save()
        context.globalAlpha = alpha_help * help_opacity * (1 - lock_border_opacity)
        help_image.draw(context, 0, 0)
        context.restore()
    }
    
    function drawMapbarOpener() {
        if (lock_border_opacity == 1) { return }
        var context = getContext()
        context.save()
        context.globalAlpha = 1 - lock_border_opacity
        setContextShadow(context, 0.4, 4, 3);
        context.translate(opener_image_width/2, canvas.height - opener_image_height/2)
        if (mapbar_open_amount > 0) { context.rotate(-Math.PI * 3/4 * mapbar_open_amount) }
        opener_image.draw(context, -opener_image_width/2, -opener_image_height/2)
        context.restore()
    }
    
    // For some reason, the images don't appear the first time the
    // map folds out, even though draw() is called in initialize().
    // It works if we try drawing again right before the map unfolds.
    bart.listenToEvent("bart_mapVisibilityChanged", null, function (event) {
        if (event.show_or_hide == "show") { draw() }
    })
    

    //---------------------------------------------------------------
    //  Notification.

    function stationsChanged () {
        var event = { type: "bart_stationChanged", 
                      start_station_name: start_marker.getStationName(),
                      end_station_name:   end_marker.getStationName() 
                    }
        bart.fireEvent(event)
    }


    //---------------------------------------------------------------
    //  Window locking.

    var locked_marker

    function lockWindow () {
        if (locked_marker) { return }
        if (dragging_marker == undefined) { return }
        if ( ! map.isZoomable) { return }
        dragging_marker.lock()
        locked_marker = dragging_marker
        help_ramp.setDirection("stopped")   // Both timers at once slows things down.
    }

    function unlockWindow () {
        if (locked_marker == undefined) { return }
        locked_marker.unlock()
        locked_marker = undefined
    }
    
    bart.listenToEvent("keydown", null, function (event) {
        if (String.fromCharCode(event.charCode) == lock_key) { lockWindow() }
    })
    

    //---------------------------------------------------------------
    //  Mouse drag handling.

    var last_x = 0
    var last_y = 0

    var help_ramp = new Ramp (function (v) { help_opacity = v; draw() })
    
    bart.listenToEvent("mousedown", canvas, function (event,x,y) {
        y += canvas_offset_dy
        tryMouseDownOnMapWithOpenMapbar(x,y) ||
        tryMouseDownOnMarker(x,y) || 
        tryMouseDownOnMapbar(x,y) || 
        tryMouseDownOnMapbarOpener(x,y)
    })
    
    function tryMouseDownOnMarker (x,y) {
        // end_marker is drawn on top, so it responds first to clicks.
        dragging_marker = (end_marker.isAt(x,y)   && end_marker)   ||
                          (start_marker.isAt(x,y) && start_marker) || undefined
        if (dragging_marker == undefined) { return false }

        dragging_marker.downAt(x,y)
        help_ramp.setDirection("up")
        setCurrentMouseDownPosition(x,y)
        draw()
        return true
    }

    function tryMouseDownOnMapWithOpenMapbar (x,y) {
        if (mapbar_open_amount == 0) { return false }
        if (y >= canvas.height) { return false }
        mapbar_open_ramp.setDirection("down")
        return true
    }
    
    function tryMouseDownOnMapbarOpener (x,y) {
        if ( ! isMapbarOpenerAt(x,y)) { return false }
        var direction = (mapbar_open_amount > 0) ? "down" : "up"
        mapbar_open_ramp.setDirection(direction)
        return true
    }

    function tryMouseDownOnMapbar (x,y) {
        if (y < canvas.height) { return false }
        return mapbar_view.downAt(x,y)
    }    

    bart.listenToEvent("mousemove", canvas, function (event,x,y) {
        y += canvas_offset_dy
        if (dragging_marker == undefined) { return }
        if (x == last_x && y == last_y)   { return }
        dragging_marker.dragTo(x,y)
        setCurrentMouseDownPosition(x,y)
    })
    
    bart.listenToEvent("mouseup", canvas, stopDragging)
    bart.listenToEvent("mouseout", canvas, stopDragging)

    function setCurrentMouseDownPosition (x,y) { last_x = x; last_y = y }

    function stopDragging () {
        if (dragging_marker == undefined) { return }
        dragging_marker.up()
        dragging_marker = undefined

        help_ramp.setDirection("down")
        // Hack so help doesn't appear as the lock is zooming out.
        if (lock_border_opacity == 1) { help_ramp.setOutput(0.01) }
        unlockWindow()
        draw()    
    }


    //---------------------------------------------------------------
    //  Button handling.
    
    bart.listenToEvent("mousedown", google_map_button, function (event,x,y) {
        if (window.widget) {
            var address = StationAddress.getByName(end_marker.getStationName())
            var address_with_plus_signs = address.replace(/ /g, '+')
            widget.openURL("http://maps.google.com/maps?q=" + address_with_plus_signs)
        }
    })
    
    bart.listenToEvent("mousedown", reverse_route_button, reverseRoute)
    
    function reverseRoute () {
        var swap = end_marker
        end_marker = start_marker
        start_marker = swap

        start_marker.savePosition()
        end_marker.savePosition()

        stationsChanged()
        draw()
    }
    

    //---------------------------------------------------------------
    //  Bookmark support.

    bart.listenToEvent("mousedown", bookmark_button, function (event) {
        var parameters = {}
        start_marker.storeParametersInObject(parameters)
        end_marker.storeParametersInObject(parameters)
        var event = { type: "bart_createBookmark", 
                      parameters: parameters
                    }
        bart.fireEvent(event)
    })

    bart.listenToEvent("bart_goToBookmark", null, function (event) {
        start_marker.restoreParametersFromObject(event.parameters)
        end_marker.restoreParametersFromObject(event.parameters)
        if (event.is_reversed) { reverseRoute() }
        draw()
    })


    //---------------------------------------------------------------
    //  Station coordinates.

    function getNameOfClosestStation (x,y) {
        var best_distance = 100000000
        var best_station
        for (var name in map.stations) {
            var station = map.stations[name]
            var dx = station.x - x
            var dy = station.y - y
            var distance = dx*dx + dy*dy
            if (distance < best_distance) {
                best_distance = distance
                best_station = name
            }
        }
        return best_station
    }


    //---------------------------------------------------------------
    //  Constructor.

    initialize()
}


//---------------------------------------------------------------
//  The folder-upper handles expanding and hiding the map.

function MapFolderUpper (map_div, belowmap_div, button) {

    var animation_time_ms =     400  // ms
    
    var collapsed_height =      0    // px
    var expanded_height =       300  // px
    var event_type = "bart_mapVisibilityChanged"
    
    function updateHeight (height) {
        map_div.style.height = "" + height + "px"
        belowmap_div.style.top = "" + height + "px"
    }

    var folder_upper = new FolderUpper(collapsed_height, expanded_height, animation_time_ms,
                                       button, event_type, updateHeight)
}

