//-----------------------------------------------------------------------------
//  DrawText.js is part of the BART dashboard widget.   (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  new_x = DrawText.drawText(context, "13 min ago", x, y)
//  width = DrawText.getTextWidth("13 min ago")
//
//  The canvas element cannot draw text.  It's a strange restriction;
//  you'd think that if there's anything a web browser would be really
//  good at, it would be text rendering.
//
//  All the text I need to display is contained within an image file.
//  To draw a string, I chop up this image and draw parts of it to
//  the canvas.
//
//  Good thing a BART widget is unlikely to need localization, hm?
// 

function DrawText () {

    //---------------------------------------------------------------
    //  Resources and constants

    var text_image = getImage("Images/text.png")
    
    var row_height = 14
    var number_spacing = 10

    var colon_index = 10
    var colon_width = 4
    
    var text_rows = {}
    var text_widths = {}
    
    var text_row_index = 0
    function textRow (text, width) {
        text_rows[text] = text_row_index++
        text_widths[text] = width
    }
    
    // Description of the text_image file.
    textRow("white_numbers", 6)
    textRow("numbers", 6)
    textRow("ago", 17)
    textRow("in", 7)
    textRow("min", 16)
    textRow("hours", 24)
    textRow("days", 20)
    textRow("and", 17)
    textRow("Transfer", 38)
    textRow("at", 8)
    textRow("MacArthur", 47)
    textRow("Bay", 18)
    textRow("Fair", 17)
    textRow("th", 8)
    textRow("St", 10)
    textRow("Balboa", 32)
    textRow("Park", 21)
    textRow("San", 17)
    textRow("Bruno", 25)
    
    //---------------------------------------------------------------
    //  Private token drawing functions.  All return the new x after
    //  drawing the text.

    function drawWord (context, text, x, y) {
        var row = text_rows[text]
        if (row == undefined) { return x }
        var width = text_widths[text]
        if (context) {
            text_image.draw(context,
                            0, row_height*row, width, row_height,
                            x, y,              width, row_height)
        }
        return x + width
    }
    
    function drawDigit (context, digit, x, y, style) {
        var row = style == "white" ? text_rows.white_numbers : text_rows.numbers
        var width = (digit == colon_index) ? colon_width : text_widths.numbers
        if (context) {
            text_image.draw(context, 
                            number_spacing*digit, row_height*row, width, row_height,
                            x,                    y,              width, row_height)
        }
        return x + width
    }

    function drawToken (context, token, x, y, style) {
        if (token == " ") { 
            return x + 3 
        }
        if (token >= "0" && token <= "9") {
            return drawDigit(context, token.charCodeAt(0) - "0".charCodeAt(0), x, y, style)
        }
        if (token == ":") {
            return drawDigit(context, colon_index, x, y, style)
        }
        return drawWord(context, token, x, y, style)
    }    
    
    //---------------------------------------------------------------
    //  Public functions

    DrawText.drawText = function (context, text, x, y, style) {
        // Avoid fuzzy text.
        x = Math.round(x)
        y = Math.round(y)
    
        // Parse the text into a token that we can draw --
        // a number, colon, space, or word.
        while (text) {
            var match = /([0-9]|:| |\w+)/.exec(text)
            if (match == false) { return x }
            var token = match[0]
            text = text.replace(token,"")
            x = drawToken(context, token, x, y, style)
        }
        return x
    }

    DrawText.getTextWidth = function (text) {
        return DrawText.drawText(null, text, 0, 0)
    }
}

// Open the package.
DrawText()

