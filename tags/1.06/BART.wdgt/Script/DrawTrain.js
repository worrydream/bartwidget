//-----------------------------------------------------------------------------
//  DrawTrain.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  new_x = DrawTrain.drawTrain(context, "red_richmond", x, y, width)
//
//  All of the trains are contained in a single image file.  This
//  draws one train by butchering up that image.
//

function DrawTrain () {

    //---------------------------------------------------------------
    //  Resources and constants

    var trains_image = getImage("Images/trains.png")
    
    var row_height = 30
    var left_x = 10
    var right_x = 485
    var slop_x = 5
    var head_width = 10
    var minimum_width = 24  // Enough to show first letter.

    var line_list = [ "red_millbrae", "red_richmond", "blue_bayfair", 
                      "yellow_pittsburg", "yellow_dalycity", 
                      "green_fremont", "green_dalycity",
                      "orange_fremont", "orange_richmond", 
                      "blue_dublin", "blue_millbrae",
                      "yellow_concord", "yellow_montgomery", "yellow_24th",
                      "yellow_sfo", "yellow_millbrae",
                      "blue_dalycity", "red_dalycity", "yellow_north_concord" ];

    var line_rows = {}      // line_row[0] = "red_richmond", etc
    for (var i=0; i < line_list.length; i++) { line_rows[line_list[i]] = i }

    //---------------------------------------------------------------
    //  Public function

    DrawTrain.drawTrain = function (context, line_name, x, y, width) {

        if (width < minimum_width) { width = minimum_width }
    
        // The head and tail don't fit together well unless the
        // coordinates are integers.
        x = Math.round(x)
        y = Math.round(y)
        width = Math.floor(width)
    
        var row = line_rows[line_name]

        // Draw the tail.
        var w = slop_x + width - head_width
        trains_image.draw(context, 
                          left_x - slop_x, row_height*row, w, row_height,
                          x - slop_x,      y,              w, row_height)
        // Draw the head.
        trains_image.draw(context, 
                          right_x - head_width,   row_height*row, head_width + slop_x, row_height,
                          x + width - head_width, y,              head_width + slop_x, row_height)

        return x + width
    }
}

// Open the package.
DrawTrain()

