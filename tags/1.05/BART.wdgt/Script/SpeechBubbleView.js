//----------------------------------------------------------------------------------
//  SpeechBubbleView.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//----------------------------------------------------------------------------------
//
//  The SpeechBubbleView class manages the "Do not announce trains from..." speech
//  bubbles.  There are two instances of this class, a large one for bookmarks and
//  a small one for the current route.  When a parameter in the bubble is changed,
//  a bart_speechParamChanged event is fired.

function SpeechBubbleView (speech_bubble, el, is_for_bookmark) {

    var top_id = (is_for_bookmark ? "bart_speech_bubble_top" : "bart_small_speech_bubble_top")

    function elem (name) { return el("speech_" + name) }


    //---------------------------------------------------------------
    //  Constants
    
    var fade_time_ms = 400  // ms


    //---------------------------------------------------------------
    //  Variables

    var mousedown_listeners = {}


    //---------------------------------------------------------------
    //  Showing and hiding.

    var opacity_ramp = new Ramp (function (v) { 
        speech_bubble.style.opacity = v
        var display = v ? "block" : "none"
    	if (speech_bubble.style.display != display) { speech_bubble.style.display = display }
    })
    opacity_ramp.setTime(fade_time_ms)

    // Fade out on any click outside the speech bubble.
    bart.listenToEvent("mousedown", null, function (event, x, y) {
        if (doesNodeAncestorHaveId(event.target, top_id) && x > 22 && x < 317) { return }
        opacity_ramp.setDirection("down")
    })

    bart.listenToEvent("bart_mouseLeftWidget", null, function (event) {
        opacity_ramp.setDirection("down") 
    })

    this.displayParameters = function (parameters, y) {
        if (is_for_bookmark) {
            createControlsForDirection(parameters, "fwd")
            createControlsForDirection(parameters, "rev")
        }
        else {
            y = 85 + parseInt(el("bottombar").style.top || 0)
            createControlsForDirection(parameters, "current")
        }
        speech_bubble.style.top = "" + y + "px"
        // We fade out on every external mousedown, so defer the fadein until afterwards.
        defer(function () { opacity_ramp.setDirection("up") })
    }
    

    //---------------------------------------------------------------
    //  Clicky words.

    function createControlsForDirection (parameters, direction) {

        createToggleControl("active",   0, "Do not", "Do", onActiveChanged)
        createNumberControl("advance",  10, 12*60)
        createToggleControl("arrival",  0, "depart", "arrive")
        if (is_for_bookmark) {
            setWhereString()
            createToggleControl("arriving", 0, "departing", "arriving")
            createTimeControl("start_time", 7*60, getStartTimeStringFromValue)
            createTimeControl("end_time",   8*60, getEndTimeStringFromValue)
            createToggleControl("weekday",  1, "day", "weekday")
        }

        function setWhereString () {
            var start = parameters.start || ""
            var end = parameters.end || ""
            var where_string = (direction == "fwd") ? start + " to " + end : end + " to " + start
            elem("where_" + direction).lastChild.nodeValue = where_string
        }

        // Hide the end of the sentence when inactive ("Do not announce...").
        function onActiveChanged (value) { 
            elem("when_" + direction).style.display = value ? "inline" : "none" 
        }

        // Put (?) after the end time if end <= start.
        function getEndTimeStringFromValue (value) {
            var start_time = getMinutesSinceMorn(parameters["speech_start_time_" + direction] || 0)
            var end_time = getMinutesSinceMorn(value)
            var time_string = minutesSinceMidnightToTimeString(value)
            if (start_time >= end_time) { time_string += " (?)" }
            return time_string

            function getMinutesSinceMorn (minutes_since_midnight) {
                var minutes_since_morn = minutes_since_midnight - timetables.starting_hour * 60
                if (minutes_since_morn < 0) { minutes_since_morn += 24 * 60 }
                return minutes_since_morn
            }
        }

        // When start time changes, update the end time so the (?) stays up-to-date.
        function getStartTimeStringFromValue (value) {
            var end_time = parameters["speech_end_time_" + direction] || 0
            elem("end_time_" + direction).lastChild.nodeValue = getEndTimeStringFromValue(end_time)
            return minutesSinceMidnightToTimeString(value)
        }


        //---------------------------------------------------------------
        //  Control types.
    
        function createToggleControl (partial_id, default_value, off_string, on_string, onValueChanged) {
            function onMouseDown (node, value, setValue) { setValue(value ? 0 : 1) }
            function getStringFromValue (value) { return value ? on_string : off_string }
            return createControl(partial_id, default_value, getStringFromValue, onMouseDown, onValueChanged || nullFunc)
        }
    
        function createNumberControl (partial_id, default_value, max_value) {
            function onMouseDown (node, value, setValue) {
                function parseNumber (string) {
                    var v = parseInt(string)
                    return (v >= 0 && v <= max_value) ? v : 10
                }
                var input = createInputField(node, 3, function (string) { setValue(parseNumber(string)) })
                input.value = value
            }
            return createControl(partial_id, default_value, identityFunc, onMouseDown, nullFunc)
        }
    
        function createTimeControl (partial_id, default_value, getStringFromValue) {
            function onMouseDown (node, value, setValue) {
                function setTime (time_string) {
                    var minutes = timeStringToMinutesSinceMidnight(time_string, "can return undefined")
                    if (minutes != undefined) { setValue(minutes) }
                }
                var input = createInputField(node, 7, setTime)
                input.value = minutesSinceMidnightToTimeString(value)
            }
            return createControl(partial_id, default_value, getStringFromValue, onMouseDown, nullFunc)
        }
    
        function createControl (partial_id, default_value, getStringFromValue, onMouseDown, onValueChanged) {
            var param_name = "speech_" + partial_id + "_" + direction
            var node = elem(partial_id + "_" + direction)
            var value
            
            setValue( (parameters[param_name] == undefined) ? default_value : parameters[param_name] )
    
            // Only install an event listener on the node the first time this is called.
            if (mousedown_listeners[param_name] == undefined) {
                bart.listenToEvent("mousedown", node, function () { mousedown_listeners[param_name]() })
            }
            // Redirect that event listenter to the appropriate function for this bookmark.
            mousedown_listeners[param_name] = function () { 
                onMouseDown(node, value, function (v) {
                    setValue(v)
                    speechParamChanged(parameters, direction)
                })
            }

            return node            

            function setValue (v) {
                value = v
                parameters[param_name] = value
                node.lastChild.nodeValue = getStringFromValue(value)
                onValueChanged(value)
            }

        }


        //---------------------------------------------------------------
        //  Text input field.

        function createInputField (element_to_replace, num_characters, setValue) {
            var parent_element = elem("when_" + direction)
            var input = document.createElement("input")
            // maxlength doesn't seem to work when set like this.
            setProperties(input, { type:"text", size:num_characters, maxlength:num_characters })
            setProperties(input.style, { "font-size":"10px" })
            if ( ! is_for_bookmark) { 
                setProperties(input.style, { position:"relative", top:"-4px", "vertical-align":"text-top" })
            }
            
            parent_element.insertBefore(input, element_to_replace)
            element_to_replace.style.display = "none"
            input.onblur = function () {
                setValue(input.value)
                // Removing the node while in its own event handler causes a segfault (!) so we defer it.
                defer(function () {
                    if (input) {
                        parent_element.removeChild(input)
                        element_to_replace.style.display = "inline"
                        input = undefined
                    }
                })
            }
            // Focusing the input before it's been properly rendered doesn't work, so we defer it.
            defer(function () { if (input) { input.focus() } })
            return input
        }
    }


    //---------------------------------------------------------------
    //  Event.

    function speechParamChanged (parameters, direction) {
        var event = { type: "bart_speechParamChanged",
                      parameters: parameters,
                      direction:  direction
                    }
        bart.fireEvent(event)
    }

}



