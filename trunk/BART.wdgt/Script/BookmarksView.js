//------------------------------------------------------------------------------
//  BookmarksView.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//------------------------------------------------------------------------------
//
//  The BookmarksView class handles the bookmark list.  This code is less clean
//  than the rest of the widget, primarily because it has to deal directly with
//  DOM manipulation, creating and removing elements.  Ick.
//

function BookmarksView (bookmarks_div, bookmark_button, speech_bubble_view) {


    //---------------------------------------------------------------
    //  Resources and constants

    var alpha_button          = 0.15
    var alpha_button_hover    = 0.5
    
    var button_fadein_ms      = 100 // ms
    var button_fadeout_ms     = 400 // ms
    
    var bookmark_fade_time_ms = 350 // ms
    var sticky_slide_time_ms  = 400 // ms

    var bookmark_row_height = 14  // px

    var button_hover_image_url = "Images/bookmark_x_hover.png"
    var close_button_image_url = "Images/bookmark_x.png"
    var speaker_button_image_urls = { on: "Images/bookmark_speaker_on.png", 
                                      off:"Images/bookmark_speaker_off.png" }


    //---------------------------------------------------------------
    //  Variables
    
    var new_bookmark_y  = 166  // px

    var sticky_shown_y  = 0    // px
    var sticky_hidden_y = -25  // px
    var sticky_visibility = 0

    var bookmarks = []


    //---------------------------------------------------------------
    //  Bookmark class.

    function Bookmark (parameters) {
        
        var bookmark = this

        var node_y = new_bookmark_y
        new_bookmark_y -= bookmark_row_height

        var node = createDomNode()


        //---------------------------------------------------------------
        //  Moving and firing.

        this.moveBy = function (dy) {
            node_y += dy
            node.style.top = "" + Math.floor(node_y) + "px"
        }

        function goToBookmark (is_reversed) {
            var event = { type: "bart_goToBookmark",
                          parameters: parameters,
                          is_reversed: is_reversed
                         }
            bart.fireEvent(event)
        }


        //---------------------------------------------------------------
        //  Queries.

        this.getNode = function () { return node }
        this.getParameters = function () { return parameters }
        this.getEncoding = function () { return encodeParameters(parameters) }
        this.isFading = function () { return node.style.opacity != 1 }

        this.hasParametersSimilarTo = function (other_parameters) {
            return (parameters.start == other_parameters.start && parameters.end == other_parameters.end)
                || (parameters.start == other_parameters.end   && parameters.end == other_parameters.start)
        }

        //---------------------------------------------------------------
        //  Fading in and out.

        var previous_height_so_far = 0
        var is_moving_up_while_fading_out = false
        var is_updating_sticky_position = true
        
        var fading_ramp = new Ramp(function (v) {
            node.style.opacity = v

            var height_so_far = Math.round(v * bookmark_row_height)
            var dy = height_so_far - previous_height_so_far
            previous_height_so_far = height_so_far

            // Move entire sticky up or down.
            sticky_shown_y += dy
            if (is_updating_sticky_position) { updateStickyPosition() }

            // If fading out, move higher bookmarks down as the sticky moves up, 
            // so they appear to stay stationary.
            if (dy < 0) {
                var foreachItemToStay= is_moving_up_while_fading_out ? foreachAfterItem : foreachNotBeforeItem
                foreachItemToStay(bookmarks, bookmark, function (b) { b.moveBy(-dy) })
                new_bookmark_y -= dy
            }

            // If we've completely faded out, kill the bookmark.
            if (v == 0) { killBookmark(bookmark) }
        })
        fading_ramp.setTime(bookmark_fade_time_ms)

        this.fadeIn = function () { fading_ramp.setDirection("up") }
        this.appear = function () { fading_ramp.setOutput(0.999); this.fadeIn() }

        this.fadeOut = function () {
            node.style["z-index"] -= 1   // Dying bookmark should appear underneath live ones.
            is_moving_up_while_fading_out = (bookmarks[0] == bookmark)  // Move up if lowest in list.
            fading_ramp.setDirection("down")
        }

        this.doNotUpdateStickyPosition = function () { is_updating_sticky_position = false }


        //---------------------------------------------------------------
        //  Updating speaker button image.

        var speaker_button
    
        function updateSpeakerButtonImage () {
            var is_active = parameters.speech_active_fwd || parameters.speech_active_rev
            var image_url = speaker_button_image_urls[is_active ? "on" : "off"]
            speaker_button.style["background-image"] = 'url("' + image_url + '")'
        }
        this.updateSpeakerButtonImage = updateSpeakerButtonImage


        //---------------------------------------------------------------
        //  Dom node.  The node looks something like so:
        //
        //                <div>
        //  close button:   <div style="background-image:url('Images/bookmark_x.png')">
        //                    <div style="background-image:url('Images/bookmark_x_hover.png')"></div>
        //                  </div>
        //  speaker button: <div style="background-image:url('Images/bookmark_speaker_off.png')">
        //                    <div style="background-image:url('Images/bookmark_x_hover.png')"></div>
        //                  </div>
        //  links[0]:       <span>Fremont to </span>
        //  links[1]:       <span>Mill</span>
        //  links[2]:       <span>brae</span>
        //  links[3]:       <span> to Frement</span>
        //                </div>
        //
        //  Since the created elements are not given IDs, event handlers are attached directly
        //  to the elements instead of letting them bubble through the top-level handler.

        function createDomNode () {

            var node = document.createElement("div")
            setProperties(node.style, { position:"absolute", left:"48px", opacity:"0", "z-index":20,
                                        top: ""+ Math.floor(node_y) + "px",
                                        "-apple-dashboard-region":"dashboard-region(control rectangle)" })
            appendCloseButton()
            speaker_button = appendSpeakerButton()
            updateSpeakerButtonImage()

            var links = []
            appendLink(parameters.start + " to ")
            appendLink(parameters.end.substring(0,Math.floor(parameters.end.length/2)))
            appendLink(parameters.end.substring(  Math.floor(parameters.end.length/2)))
            appendLink(" to " + parameters.start)


            //---------------------------------------------------------------
            //  Buttons.

            function appendCloseButton () {
                function onMouseDown () { removeBookmark(bookmark) }
                return appendButton(close_button_image_url, "-32px", onMouseDown)
            }

            function appendSpeakerButton () {
                function onMouseDown () {
                    speech_bubble_view.displayParameters(bookmark.getParameters(), node_y + sticky_shown_y)
                }
                return appendButton(speaker_button_image_urls.off, "-16px", onMouseDown)
            }
    
            function appendButton (image_url, left_px, onMouseDown) {
                var button = document.createElement("div")
                setProperties(button.style, { position:"absolute", left:left_px, top:"-1px",
                                            "background-image": 'url("' + image_url + '")',
                                            "-apple-dashboard-region":"dashboard-region(control rectangle)" })
                
                var hover = document.createElement("div")
                setProperties(hover.style, { width:"11px", height:"11px", opacity:alpha_button,
                                             "background-image": 'url("' + button_hover_image_url + '")' })
                
                var hover_ramp = new Ramp (function (v) { 
                    hover.style.opacity = v * alpha_button_hover + (1-v) * alpha_button
                })
                
                hover.onmouseover = function () { 
                    hover_ramp.setTime(button_fadein_ms); 
                    hover_ramp.setDirection("up") 
                }
                hover.onmouseout = function () { 
                    hover_ramp.setTime(button_fadeout_ms); 
                    hover_ramp.setDirection("down") 
                }
                hover.onmousedown = onMouseDown
                
                button.appendChild(hover)
                node.appendChild(button)

                return button
            }


            //---------------------------------------------------------------
            //  Links.
    
            function appendLink (text) {
                var index = links.length

                var link = document.createElement("span")
                var textNode = document.createTextNode(text)
                link.appendChild(textNode)
                
                link.style.cursor = "pointer"

                link.onmouseover = function () { 
                    foreachRelatedLink(index, function (link) { link.style["text-decoration"] = "underline" })
                }
                link.onmouseout  = function () {
                    foreachRelatedLink(index, function (link) { link.style["text-decoration"] = "none" })
                }
                link.onmousedown = function () { 
                    var is_reversed = (index >= 2)
                    goToBookmark(is_reversed) 
                }

                node.appendChild(link)
                links.push(link)
            }

            // Mousing over links 0 and 1 will underline 0, 1, and 2.
            // Mousing over links 2 and 3 will underline 1, 2, and 3.
            function foreachRelatedLink (index, func) {
                var first_index = (index >= 2) ? 1 : 0
                var last_index  = (index >= 2) ? 3 : 2
                for (var i=first_index; i <= last_index; i++) { func(links[i]) }
            }
            
            return node
        }
    }


    //---------------------------------------------------------------
    //  Adding and removing bookmarks.

    bart.listenToEvent("bart_createBookmark", null, function (event) {
        var existing_bookmark = findSimilarBookmark(event.parameters)
        if (existing_bookmark) {
            if (existing_bookmark.isFading()) { return }
            existing_bookmark.doNotUpdateStickyPosition()  // Hack to prevent the sticky from jittering.
            removeBookmark(existing_bookmark) 
        }
        var bookmark = createBookmarkHidden(event.parameters)
        bookmark.fadeIn()
        window.resizeTo(window.innerWidth, window.innerHeight + bookmark_row_height)
        storeBookmarks()
    })

    function addBookmarkFromEncoding (encoding) {       // Used during initial load.
        var parameters = decodeParameters(encoding)
        var bookmark = createBookmarkHidden(parameters)
        bookmark.appear()
    }
    
    function createBookmarkHidden (parameters) {
        var bookmark = new Bookmark (parameters)
        bookmarks.push(bookmark)
        bookmarks_div.appendChild(bookmark.getNode())
        bart.fireEvent({ type:"bart_bookmarkAdded", parameters:bookmark.getParameters() })
        return bookmark
    }
    
    function removeBookmark (bookmark) {
        bart.fireEvent({ type:"bart_bookmarkRemoved", parameters:bookmark.getParameters() })
        bookmark.fadeOut()
    }

    function killBookmark (bookmark) {      // Called when bookmark has finished fading out.
        var index = findIndex(bookmarks, bookmark)
        if (index == undefined) { return }

        bookmarks.splice(index,1)
        bookmarks_div.removeChild(bookmark.getNode())
        window.resizeTo(window.innerWidth, window.innerHeight - bookmark_row_height)
        storeBookmarks()
    }

    function findSimilarBookmark (parameters) {
        return foreach(bookmarks, function (bookmark) {
            if (bookmark.hasParametersSimilarTo(parameters)) { return bookmark }
        })
    }


    //---------------------------------------------------------------
    //  Speech features.

    bart.listenToEvent("bart_speechParamChanged", null, function (event) {
        storeBookmarks()
        foreach(bookmarks, function (bookmark) {
            if (event.parameters == bookmark.getParameters()) {
                bookmark.updateSpeakerButtonImage()
            }
        })
    })


    //---------------------------------------------------------------
    //  Moving the sticky around.

    function setUpHideAndShow () {
        var ramp = new Ramp( function (v) {
            sticky_visibility = v
            updateStickyPosition()
        })
        ramp.setIsWarped(true)
        ramp.setTime(sticky_slide_time_ms)
        
        bart.listenToEvent("mouseout",  null, function () { ramp.setDirection("down") })
        bart.listenToEvent("mousemove", null, function () { 
            if (bookmarks.length) { ramp.setDirection("up") } 
        })
    }
    
    function updateStickyPosition () {
        var y = sticky_visibility * sticky_shown_y + (1-sticky_visibility) * sticky_hidden_y
        bookmarks_div.style.top = "" + Math.floor(y) + "px"
        var display = sticky_visibility ? "block" : "none"
    	if (bookmarks_div.style.display != display) { bookmarks_div.style.display = display }
    }


    //---------------------------------------------------------------
    //  Encoding.

    var parameter_separator = "&"
    
    function encodeParameters (parameters) {
        var param_encodings = []
        for (var key in parameters) {
            param_encodings.push(escape(key) + "=" + escape(parameters[key]))
        }
        return param_encodings.join(parameter_separator)
    }

    function decodeParameters (encoding) {
        var parameters = {}
        foreach (encoding.split(parameter_separator), function (param_encoding) {
            var matches = /([^=]+)=(.*)/.exec(param_encoding)
            if (matches && matches[2] != undefined) {
                var value = unescape(matches[2])
                // Make sure numbers are stored as numbers, not strings.
                if (value == parseFloat(value)) { value = parseFloat(value) }
                parameters[unescape(matches[1])] = value
            }
        })
        return parameters
    }


    //---------------------------------------------------------------
    //  Persistence.
    
    var encoding_separator = ";"

    function storeBookmarks () {
        var encodings = []
        foreach(bookmarks, function (bookmark) { encodings.push(bookmark.getEncoding()) })
        var total_encoding = encodings.join(encoding_separator)
        bart.storeProperty("bookmarks", total_encoding)
    }
    
    function loadBookmarks () {
        var total_encoding = bart.retrievePropertyOrDefault("bookmarks", "")
        if (total_encoding == "") { return }
        var encodings = total_encoding.split(encoding_separator)
        foreach(encodings, addBookmarkFromEncoding)
        window.resizeTo(window.innerWidth, window.innerHeight + bookmark_row_height * bookmarks.length)
    }


    //---------------------------------------------------------------
    //  Construction.

    setUpHideAndShow()
    loadBookmarks()
    
}



