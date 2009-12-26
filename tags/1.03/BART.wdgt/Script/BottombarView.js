//------------------------------------------------------------------------------
//  BottombarView.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//------------------------------------------------------------------------------
//
//  The BottombarView class handles the visual effects for the buttons at the
//  bottom.  Clicks on the buttons are handled by whomever can perform the
//  requested action.
//

function BottombarView (front_div, buttons_image, clock_button, bookmark_button, announce_button,
                        reverse_route_button, change_route_button, google_map_button, info_button,
                        timebar_buttons_image, timebar_date_left_button, timebar_date_right_button) {

    var button_fade_in_time_ms  = 100  // ms
    var button_fade_out_time_ms = 400  // ms
    var label_fade_in_time_ms   = 200  // ms
    var label_fade_out_time_ms  = 800  // ms

    var button_opacity = 0.5
    var labels_opacity = 1

    // Ideally this would use "mouseover" instead of "mousemove", but that
    // works even more poorly than this does.
    function setUpButtonFade (button, fade_out_when_down) {
        var ramp = new Ramp( function (v) { button.style.opacity = v * button_opacity } )
        function fadeIn () {
            ramp.setTime(button_fade_in_time_ms)
            ramp.setDirection("up")
        }
        function fadeOut () {
            ramp.setTime(button_fade_out_time_ms)
            ramp.setDirection("down")
        }
        // Ideally we should just listen to mousemove over the button, but that
        // doesn't work when the map is resizing and the buttons are moving around.
        var wait_for_outside_movement = false
        bart.listenToEvent("mousemove", null, function (event) {
            var fadeFunc = (event.target == button && wait_for_outside_movement == false) ? fadeIn : fadeOut
            fadeFunc()
            wait_for_outside_movement = (wait_for_outside_movement && (event.target == button))
        })
        bart.listenToEvent("mouseout", button, fadeOut)
        if (fade_out_when_down) { 
            bart.listenToEvent("mousedown", button, function () {
                wait_for_outside_movement = true
                fadeOut()
            })
        }
    }

    // The event listeners trigger on -all- elements.  There is (AFAIK) no way to
    // tell when the mouse enters or leaves an aggregate object, such as the top-level
    // div.  So, we fade out on mouseout, when the mouse leaves -any- element, under
    // the theory that a mousemove will come along afterwards to fade us back in.
    //
    // This is how Apple's widgets operate.  I find the situation repugnant.
    function setUpLabelsFade (image1, image2) {
        var last_ramp_output = 0
        var ramp = new Ramp( function (v) {
            image1.style.opacity = image2.style.opacity = v * labels_opacity
            if (last_ramp_output >= 0.8 && v < 0.8) {
                bart.fireEvent({ type:"bart_mouseLeftWidget" })
            }
            last_ramp_output = v
        })
        bart.listenToEvent("mousemove", null, function (event) {
            ramp.setTime(label_fade_in_time_ms)
            ramp.setDirection("up")
        })
        bart.listenToEvent("mouseout", null, function (event) {
            ramp.setTime(label_fade_out_time_ms)
            ramp.setDirection("down")
        })
    }

    setUpLabelsFade(buttons_image, timebar_buttons_image)
    
    setUpButtonFade(clock_button, "fade out when down")
    setUpButtonFade(bookmark_button)
    setUpButtonFade(announce_button)
    setUpButtonFade(reverse_route_button)
    setUpButtonFade(change_route_button, "fade out when down")
    setUpButtonFade(google_map_button, "fade out when down")
    setUpButtonFade(info_button, "fade out when down")
    setUpButtonFade(timebar_date_left_button)
    setUpButtonFade(timebar_date_right_button)

    //-------------------------------------------------------------------------
    // Change button labels when something is expanded or collapsed.

    var labels_speech_modifier_active = ", url('Images/buttons_speaker.png')"
    
    var labels_map_modifier = ""
    var labels_timebar_modifier = ""
    var labels_speech_modifier = bart.retrieveProperty("speech_active_current") ?
                                                  labels_speech_modifier_active : ""
    
    // Change the "Change Route" label to "Hide Map" when the map expands.
    bart.listenToEvent("bart_mapVisibilityChanged", null, function (event) {
        labels_map_modifier = (event.show_or_hide == "show") ? "_map" : ""
        updateButtonLabels()
    })

    // Change the clock icon to the sync icon when the timebar expands.
    bart.listenToEvent("bart_timebarVisibilityChanged", null, function (event) {
        labels_timebar_modifier = (event.show_or_hide == "show") ? "_timebar" : ""
        updateButtonLabels()
    })

    bart.listenToEvent("bart_speechParamChanged", null, function (event) {
        if (event.direction != "current") { return }
        labels_speech_modifier = (event.parameters.speech_active_current ? 
                                           labels_speech_modifier_active : "")
        updateButtonLabels()
    })

    function updateButtonLabels () {
        var image_name = "buttons" + labels_timebar_modifier + labels_map_modifier + ".png"
        buttons_image.style["background-image"] = "url('Images/" + image_name + "')" + labels_speech_modifier
    }
    
    defer(updateButtonLabels)
    
}

