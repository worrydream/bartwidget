//--------------------------------------------------------------------------------
//  Map.js is part of the BART dashboard widget.        (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//--------------------------------------------------------------------------------
//
//  The Map class is a thin encapsulation of a map's images and station
//  coordinates, which MapView and MapbarView use to do their thing.
//

function Map (name) {

    //---------------------------------------------------------------
    //  Public properties
    
    this.image      = getImage("Maps/" + name + "/map.jpg")
    this.icon_image = getImage("Maps/" + name + "/icon.png")
    this.name_image = getImage("Maps/" + name + "/name.png")

    this.name     = name
    this.stations = {}

    //---------------------------------------------------------------
    //  For use in info.js

    this.addStation = function (name,x,y) {
        this.stations[name] = { x:x, y:y }
    }

    //---------------------------------------------------------------
    //  Add to list when created.

    Map.maps.push(this) 
}


//---------------------------------------------------------------
//  Global map list.

Map.maps = []

Map.forEachMap = function (f) {
    for (var i=0; i < Map.maps.length; i++) {
        f(Map.maps[i])
    }
}

Map.getMapByName = function (name) {
    for (var i=0; i < Map.maps.length; i++) {
        var map = Map.maps[i]
        if (map.name == name) { return map }
    }
}

Map.getMapByIndex = function (index) {
    return Map.maps[index]
}

