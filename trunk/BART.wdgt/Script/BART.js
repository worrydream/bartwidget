//-----------------------------------------------------------------------------
//  BART.js is part of the BART dashboard widget.       (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  The Bart class contains the "main" function (onLoad) plus some fundamental 
//  plumbing (event handling and persistence).
//

function Bart () {

    this.version = "1.07"


    //---------------------------------------------------------
    //  Debug controls.

    // Set this for a TripList around a particular date and time, instead of dateNow().
    var debug_start_date = undefined    // = new Date(2005,6,12, 11,0)

    // Set this to true to run the test suite.
    var debug_run_tests = false

    // Set this to true to log all events to the console.
    var debug_log_events = false


    //---------------------------------------------------------
    //  onLoad.  This is where it all starts.

    this.onLoad = function () {
        if (debug_run_tests) {
            var test = new Test()
            test.run()
        }
        else {
            makeViews()
        }
    }

    
    //---------------------------------------------------------
    //  Event management.  This is used for the widget's internal events as
    //  well as external DOM events.  There are no priorities or capturing --
    //  if you listen for something, you'll hear it.

    var event_handler_lists = {}
    
    // bart.listenToEvent("mousedown", document.getElementById("foo"), function (event,x,y) {} )
    // If "element" is null, the handler is called when any event of that type is received.
    this.listenToEvent = function (event_name, element, handleEvent) {
        if (event_handler_lists[event_name] == undefined) { event_handler_lists[event_name] = [] }
        event_handler_lists[event_name].push( { element:element, handleEvent:handleEvent } )
    }
    
    this.fireEvent = function (event) {
        if (debug_log_events) { logEvent(event) }
        var event_handler_list = event_handler_lists[event.type]
        if (event_handler_list == undefined) { return }
        var coords = getCoordsFromEvent(event)
        for (var i=0; i < event_handler_list.length; i++) {
            var event_handler = event_handler_list[i]
            var target = event.bart_target || event.target
            if (event_handler.element && event_handler.element != target) { continue }
            event_handler.handleEvent(event, coords.x, coords.y) 
        }
    }
    
    // Event logging.
    var last_log_message
    function logEvent (event) {
        var message = 'event: ' + event.type
        var target = event.bart_target || event.target
        if (target) { 
            message += ' on ' + target 
            if (target.id) { message += ' ' + target.id }
        }
        if (event.type == "mousemove" && message == last_log_message) { return }
        last_log_message = message
        console.debug(message)
    }
    
    // This is pretty much a hack, because the system won't give me coordinates relative
    // to the div that generated the event.  When the map is visible, the coords given
    // to the trip list are incorrect, but it works because the the trip list only cares
    // about deltas, not absolutes.
    function getCoordsFromEvent (event) {
        if (!event.clientX || !event.clientY) { return {} }
        var x = event.clientX - 8;  // canvas left
        var y = event.clientY - 31; // titlebar height
        return { x:x, y:y }
    }

    // Eventify a few widget-specific callbacks.
    if (window.widget) {
        widget.onshow   = function () {  bart.fireEvent( { type:"show"   } )  }
        widget.onhide   = function () {  bart.fireEvent( { type:"hide"   } )  }
        widget.onremove = function () {  bart.fireEvent( { type:"remove" } )  }
    }
    document.addEventListener("keydown", function () { bart.fireEvent(event) }, true);
    document.addEventListener("keyup",   function () { bart.fireEvent(event) }, true);


    //---------------------------------------------------------
    //  Persistence.  The documentation doesn't say how setPreferenceForKey 
    //  is implemented, but I don't want to do a file write every time a 
    //  marker is dragged on the map.  So, stored properties are cached
    //  the activity dies down, and then flushed.

    var properties = {}
    var recently_stored_properties = {}
    var save_background_action = new BackgroundAction(5000)  // ms
    
    function saveRecentlyStoredProperties () {
        for (name in recently_stored_properties) {
            var value = recently_stored_properties[name]
            widget.setPreferenceForKey(value, name)     // Who chose this argument ordering??
        }
        recently_stored_properties = {}
    }
    
    this.listenToEvent("remove", null, saveRecentlyStoredProperties)
    
    this.storeProperty = function (name, value) {
        properties[name] = value
        if (window.widget) {
            recently_stored_properties[name] = value
            save_background_action.set(saveRecentlyStoredProperties)
        }
    }

    this.retrieveProperty = function (name) {
        if (properties[name] == undefined && window.widget) {
            properties[name] = widget.preferenceForKey(name)
        }
        return properties[name]
    }

    this.retrievePropertyOrDefault = function (name, default_value) {
        var value = this.retrieveProperty(name)
        if (value == undefined) { value = default_value }
        return value
    }


    //---------------------------------------------------------
    //  Views.  The views install their own event handlers,
    //  and that's how everything gets done.

    function makeViews () {

        function el (name) { return document.getElementById("bart_" + name) }

        var front_div = document.getElementById("front")
        var behind_div = document.getElementById("behind")

        var titlebar_view = new TitlebarView( el("from"), el("to"), el("fare") )

        var bottombar_view = new BottombarView(front_div, el("buttons_image"), 
                el("clock_button"), el("bookmark_button"), el("announce_button"),
                el("reverse_route_button"), el("change_route_button"), el("google_map_button"),
                el("info_button"), el("timebar_buttons_image"), el("timebar_date_left_button"),         
                el("timebar_date_right_button")  )

        var speech_bubble_view = new SpeechBubbleView(el("speech_bubble"), el, "for bookmark")

        var small_speech_bubble_view = new SpeechBubbleView(el("small_speech_bubble"), el)

        var speaking_view = new SpeakingView(small_speech_bubble_view, el("announce_button"))

        var trip_list_view = new TripListView(el("triplist_canvas"), el("triplist_help_div"),
                                              debug_start_date)

        var bookmarks_view = new BookmarksView(el("bookmarks"), el("bookmark_button"), speech_bubble_view)
        
        var map_view = new MapView(el("map_canvas"), el("reverse_route_button"), 
                                   el("google_map_button"), el("bookmark_button") )
    
        var map_folder_upper = new MapFolderUpper(el("map_div"),el("belowmap_div"),el("change_route_button"))

        var timebar_view = new TimebarView(el("timebar_timeline"), el("timebar_sun"), el("timebar_sun_hover"),
                                           el("timebar_date"), el("timebar_date_left_button"), 
                                           el("timebar_date_right_button")  )

        var timebar_folder_upper = new TimebarFolderUpper(el("timebar"),el("lowerbars_div"),el("bottombar"),
                                                          el("belowlowerbars_div"), el("clock_button") )
        var update_available_view = new UpdateAvailableView(el("update_available_div"), 
                                                            el("triplist_help_div") )

        var flipside_view = new FlipsideView(front_div, behind_div, el("info_button"), el("done_button"),
                el("cancel_button"), el("submit_button"), el("speaker_button"), el("flipside_textarea"),
                el("flipside_sticky_text"), el("frontside_sticky"), el("flipside_version_text")  )
    }


    //---------------------------------------------------------
    //  Current route.  Glue between the map view and trip list view.

    var stations = new Stations()
    this.stations = stations

    // Computing the route takes some time, and if we do it every
    // time start or end changes, dragging on the map view gets jerky.
    // So, we background it until things settle down a little.
    var route_background_action = new BackgroundAction(20)  // ms

    this.listenToEvent("bart_stationChanged", null, function (event) {
        var start = stations.getByName(event.start_station_name)
        var end   = stations.getByName(event.end_station_name)
        route_background_action.set( function () {
            var route = start.routeTo(end)
            var event = { type:"bart_routeChanged", route:route }
            bart.fireEvent(event)
        })
    })

}


//---------------------------------------------------------
//  Through the global bart object, everyone can listen to
//  events and store properties.

bart = new Bart()


