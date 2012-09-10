//-----------------------------------------------------------------------------
//  DrawUtils.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  Graphics utility functions.
//

function setContextShadow (context, alpha, blur_px, y_offset) {
    var color = "rgba(0,0,0," + alpha + ")"
    context.shadowColor = color
    context.shadowBlur = blur_px
    context.shadowOffsetX = 0
    context.shadowOffsetY = y_offset
}
    
function getImage (name) {
    var image = new Image()
    image.src = name
    
    var isLoaded = false
    image.onload = function () { isLoaded = true }

    image.draw = function () {
        if (!isLoaded) { return }
        var context = arguments[0]
        arguments[0] = image
        
        clipDimensionOfImageArguments(image,arguments,"width")
        clipDimensionOfImageArguments(image,arguments,"height")

        if (context.drawImage.apply) {
            context.drawImage.apply(context,arguments)
        }
        else {      // Tiger doesn't support function.apply
            if (arguments.length == 9) {
                context.drawImage(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4],
                                                arguments[5], arguments[6], arguments[7], arguments[8])
            }
            else if (arguments.length == 3) {
                context.drawImage(arguments[0], arguments[1], arguments[2])
            }
            else if (arguments.length == 5) {
                context.drawImage(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4])
            }
        }
    }

    return image
}

function clipDimensionOfImageArguments (image,args,dimension) {
    var offset = (dimension == "height") ? 1 : 0;
    var x = args[1 + offset]
    var w = args[3 + offset]
    if (x === undefined || w === undefined) { return }

    if (x < 0) {
        x = 0
        args[1 + offset] = x
    }

    var max = image[dimension]
    if (x + w > max) { 
        w = max - x
        args[3 + offset] = w
    }
}