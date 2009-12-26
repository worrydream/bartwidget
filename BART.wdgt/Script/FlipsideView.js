//------------------------------------------------------------------------------
//  FlipsideView.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//------------------------------------------------------------------------------
//
//  The FlipsideView class manages everything on the reverse side of the widget,
//  such as getting there, the comment box, and the dynamic sticky note.
//

function FlipsideView (front_div, behind_div, info_button, done_button, cancel_button, submit_button,
                       speaker_button, comment_textarea, sticky_text, thank_you_sticky, 
                       version_text) {

    //---------------------------------------------------------
    //  Constants

    var window_height_on_flip_side = 410 // px

    var alpha_disabled_submit_button = 0.4

    var submit_button_fadein_ms  =  400 // ms
    var thank_you_sticky_time_ms = 5000 // ms


    //---------------------------------------------------------
    //  Flippin'

    var window_height_on_front_side

    function flipToBack () {
    	if (window.widget) {
            window_height_on_front_side = window.innerHeight
            var flip_side_height = Math.max(window_height_on_front_side, window_height_on_flip_side)
            resizeWindowIfNecessary(flip_side_height)
    		widget.prepareForTransition("ToBack")
    		setTimeout("widget.performTransition()", 0)
        }
        setStickyText()
        setCommentText()
    	behind_div.style.display = "block"
    	front_div.style.visibility = "hidden"
        thank_you_sticky.style.visibility = "hidden"
    }

    function flipToFront () {
    	if (window.widget) {
    		widget.prepareForTransition("ToFront")
            resizeWindowIfNecessary(window_height_on_front_side)
    		setTimeout("widget.performTransition()", 0)
        }
    	behind_div.style.display = "none"
    	front_div.style.visibility = "visible"
    }

    bart.listenToEvent("mousedown", info_button, flipToBack)
    bart.listenToEvent("mousedown", done_button, flipToFront)

    function resizeWindowIfNecessary (height) {
        if (height == window.innerHeight) { return }
        window.resizeTo(window.innerWidth, height)
    }


    //---------------------------------------------------------
    //  Thank you for your comment!

    var is_submit_button_enabled

    var thank_you_ramp = new Ramp( function (v) {
        // Stay opaque for the first half, and then fade out.
        thank_you_sticky.style.opacity = (v < 0.5) ? v * 2 : 1
        if (v == 0) { thank_you_sticky.style.visibility = "hidden" }
    })
    thank_you_ramp.setTime(thank_you_sticky_time_ms)

    bart.listenToEvent("mousedown", submit_button, function () {
        if ( ! is_submit_button_enabled) { return }
    
        // Send me some love.
        var comment = escape(comment_textarea.value)
        var req = new XMLHttpRequest()
        req.open("POST", "http://www.worrydream.com/cgi-bin/bartwidget_comment", true)
        req.send("version=" + escape(bart.version) + "&comment=" + comment)

        // Send you some love.
        flipToFront()
        thank_you_sticky.style.visibility = "visible"
        thank_you_sticky.style.opacity = 1
        thank_you_ramp.setOutput(1)
        thank_you_ramp.setDirection("down")
    })


    //---------------------------------------------------------
    //  Version.

    version_text.lastChild.nodeValue = "v" + bart.version
    
    bart.listenToEvent("mousedown", version_text, function () {
        if (window.widget) {
            widget.openURL("http://worrydream.com/bartwidget/")
        }
    })
    

    //---------------------------------------------------------
    //  Comment text area.
    
    var submit_button_ramp = new Ramp(function (v) {
        submit_button.style.opacity = (1-v) * alpha_disabled_submit_button + v
        cancel_button.style.opacity = v
        done_button.style.opacity   = 1 - v
    })
    submit_button_ramp.setTime(submit_button_fadein_ms)
    
    function setCommentText () {
        comment_textarea.value = "Re: BART widget"
        submit_button_ramp.setDirection("down")
        submit_button_ramp.setOutput(0)
        submit_button_ramp.update()
        is_submit_button_enabled = false
    }

    bart.listenToEvent("keydown", comment_textarea, function () {
        submit_button_ramp.setDirection("up")
        is_submit_button_enabled = true
    })


    //---------------------------------------------------------
    //  Sticky text.
    
    var excuses = new Excuses()

    function setStickyText () {
        var text = "This widget suggests trips based upon published schedules. "
        text += "Be aware that delays may occur due to "
        text += excuses.getExcuse() + " or " + excuses.getExcuse() + ". "
        sticky_text.lastChild.nodeValue = text
    }

}

