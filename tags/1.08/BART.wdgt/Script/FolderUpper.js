//-----------------------------------------------------------------------------
//  FolderUpper.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  The FolderUpper class handles expanding and collapsing things.
//

function FolderUpper (collapsed_height, expanded_height, animation_time_ms, 
                      button, event_type, updateHeight) {

    //---------------------------------------------------------
    //  Variables

    var current_height = collapsed_height
    var is_expanded = false

    var ramp = new Ramp( function (v) { setHeight(Math.round(v * expanded_height)) } )
    ramp.setTime(animation_time_ms)
    ramp.setIsWarped(true)

    //---------------------------------------------------------
    //  Showing and hiding.

    function setHeight (height) {
        updateHeight(height)
        if (window.widget) {
            // Before we start to grow, resize the window to its expanded height.
            if (current_height == collapsed_height && height > collapsed_height) {
                window.resizeTo(window.innerWidth, window.innerHeight + expanded_height - collapsed_height)
            }
            // Once we've finished shrinking, resize the window to its collapsed height.
            else if (height == collapsed_height && current_height > collapsed_height) {
                window.resizeTo(window.innerWidth, window.innerHeight - expanded_height + collapsed_height)
            }
        }
        current_height = height
    }

    function show () { ramp.setDirection("up")   }
    function hide () { ramp.setDirection("down") }

    //---------------------------------------------------------
    //  Button-handling and notification.
    
    bart.listenToEvent("mousedown", button, function (event,x,y) {
        if (is_expanded) { hide() } else { show() }
        is_expanded = !is_expanded
        sendEvent()
    })
    
    function sendEvent () {
        var event = { type: event_type,
                      show_or_hide: is_expanded ? "show" : "hide"
                    }
        bart.fireEvent(event)
    }

}

