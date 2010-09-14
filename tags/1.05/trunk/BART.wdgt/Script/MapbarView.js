//--------------------------------------------------------------------------------
//  MapbarView.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//--------------------------------------------------------------------------------
//
//  The MapBarView manages drawing and mousing on the "choose your map" section
//  which is normally hidden underneath the MapView.  Unlike the other Views,
//  this object is not autonomous, but is owned and operated by the MapView.
//
//  When a new map is selected, a bart_mapChanged event is fired.
//

function MapbarView (canvas) {

    //---------------------------------------------------------------
    //  Resources and constants

    // metrics
    var mapbar_height = 115  // px

    var icon_start_x  = 0   // px
    var icon_dx =       84  // px
    
    // background image
    var grate_image = getImage("Images/mapbar_grate.png")


    //---------------------------------------------------------------
    //  Active map

    var active_map = Map.getMapByName(bart.retrieveProperty("map_name") || "Classic")
                  || Map.getMapByIndex(0)

    this.getActiveMap = function () { return active_map }


    //---------------------------------------------------------------
    //  Drawing

    this.getHeight = function () { return mapbar_height }

    this.draw = function (context, open_amount) {
        // Assumes that MapView has translated the context so the top-left
        // of the MapbarView is at the origin.
        drawBackground(context)
        drawIcons(context, open_amount)
    }

    function drawBackground (context) {
        grate_image.draw(context, 0,0)
    }

    function drawIcons (context, open_amount) {
        var x = icon_start_x - canvas.width * (1 - open_amount)
        var y = 0
        Map.forEachMap(function (map) {
            drawIconForMap(map, context, x, y)
            x += icon_dx
        })
    }
    
    function drawIconForMap (map, context, x, y) {
        context.save()
        if (map == active_map) { setContextShadow(context, 0.7, 12, 11) }
        else                   { setContextShadow(context, 0.5, 6, 5) }
        map.icon_image.draw(context, x, y)
        context.restore()
        map.name_image.draw(context, x, y)
    }


    //---------------------------------------------------------------
    //  Mouse handling

    this.downAt = function (x,y) {
        var icon_index = Math.floor((x - icon_start_x) / icon_dx)
        var map = Map.getMapByIndex(icon_index)
        if (map == undefined) { return false }
        if (map == active_map) { return true }

        active_map = map
        bart.fireEvent( { type: "bart_mapChanged", map: map } )
        bart.storeProperty("map_name", map.name)
        return true
    }
}

