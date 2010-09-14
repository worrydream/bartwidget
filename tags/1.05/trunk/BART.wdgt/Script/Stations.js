//-----------------------------------------------------------------------------
//  Stations.js is part of the BART dashboard widget.       (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  The Stations class knows about all of the BART stations and how to get
//  from one to the other.
//
//  stations = new Stations()
//  start_station = stations.getByName("Del Norte")
//  end_station = stations.getByName("Castro Valley")
//  route = start_station.routeTo(end_station)
//
//  You might argue that the approach taken here is, shall we say,
//  less than elegant, and I'd probably agree if you said it nicely.
//  The routing functions are more explicit than they should be.
//  But there are some tricky issues (such as getting between SF and
//  the southeast bay either directly or via the transfer station) 
//  and it seemed clearest to just write it all out.
//
//  I didn't do any research here -- I just wrote this off the top
//  of my head.  If you be all down wit' the routing algorizzles, 
//  feel free to replace this mess with something tidy and clever, 
//  and send it in.
//

function Stations () {

    //---------------------------------------------------------
    //  Station class.  A station is in at least one zone, and its
    //  indexInZone gives its position along the line.  Thus, we can
    //  route within a zone by comparing indexes and deciding whether
    //  to go north or south.  Transfer points have indexes in 
    //  multiple zones, thus can bridge across them.

    function Station (name, routeTo) {
    
        this.getIndexInZone = function (zone_name) {
            return this.index_in_zone[zone_name]
        }
        this.isInZone = function (zone_name) {
            return (this.index_in_zone[zone_name] != undefined)
        }
        this.toString = function () { return this.name }
        
        this.name = name
        this.routeTo = routeTo
        this.index_in_zone = {}
        
    }

    //---------------------------------------------------------
    //  stations table.
    
    var stations = {}
    
    this.getByName = function (name) {
        return stations[name]
    }

    this.forEachStation = function (func) {
        for (name in stations) {
            var are_we_done = func(stations[name])
            if (are_we_done) { return are_we_done }
        }
    }
    
    //---------------------------------------------------------
    //  Private functions.
    
    // makeZone("My Zone", { station_names:[ ... ], routeTo: function (dest) {} } )
    function makeZone (zone_name, props) {
        for (var i=0; i < props.station_names.length; i++) {
            var name = props.station_names[i]
            if (stations[name] == undefined) {
                stations[name] = new Station(name, props.routeTo)
            }
            stations[name].index_in_zone[zone_name] = i
        }
    }
    
    function routeWithinZone (start_station, end_station, zone_name, north_lines, south_lines) {
        var start_index = start_station.getIndexInZone(zone_name)
        var end_index = end_station.getIndexInZone(zone_name)
        var lines = (end_index > start_index) ? south_lines : north_lines
        return Route.parallelLegs(start_station, end_station, lines)
    }
    
    function routeThroughTransfer (start_station, end_station, transfer_station) {
        return Route.series(start_station.routeTo(transfer_station),
                            transfer_station.routeTo(end_station))
    }
    
    function routePeninsulaZone (start_station, end_station, transfer_station, 
                                 zone_name, north_lines, south_lines) {
        if (end_station.isInZone(zone_name)) {
            return routeWithinZone(start_station, end_station, zone_name, north_lines, south_lines)
        }
        else {
            return routeThroughTransfer(start_station, end_station, transfer_station)
        }
    }
    
    //-------------------------------------------------------------
    // Peninsula zones (one transfer station)
    
    makeZone("Richmond", {
        station_names: [ "Richmond", "Del Norte", "Plaza", "North Berkeley", 
                         "Berkeley", "Ashby", "MacArthur" ],
        routeTo: function (dest) { 
            var north_lines = [ "red_richmond", "orange_richmond" ]
            var south_lines = [ "red_millbrae", "orange_fremont" ]
            var transfer_station = stations["MacArthur"]
            return routePeninsulaZone(this, dest, transfer_station, "Richmond", north_lines, south_lines)
        }
    })
    
    makeZone("Pittsburg", {
        station_names: [ "Pittsburg", "North Concord", "Concord", "Pleasant Hill", "Walnut Creek",
                         "Lafayette", "Orinda", "Rockridge", "MacArthur" ],
        routeTo: function (dest) { 
            var north_lines = [ "yellow_pittsburg" ]
            var south_lines = [ "yellow_millbrae" ]
            var transfer_station = stations["MacArthur"]
            return routePeninsulaZone(this, dest, transfer_station, "Pittsburg", north_lines, south_lines)
        }
    })
    
    makeZone("Dublin", {
        station_names: [ "Bay Fair", "Castro Valley", "Dublin" ],
        routeTo: function (dest) { 
            var north_lines = [ "blue_dalycity" ]
            var south_lines = [ "blue_dublin" ]
            var transfer_station = stations["Bay Fair"]
            return routePeninsulaZone(this, dest, transfer_station, "Dublin", north_lines, south_lines)
        }
    })
    
    makeZone("Fremont", {
        station_names: [ "Bay Fair", "Hayward", "South Hayward", "Union City", "Fremont" ],
        routeTo: function (dest) { 
            var north_lines = [ "orange_richmond", "green_dalycity" ]
            var south_lines = [ "orange_fremont", "green_fremont" ]
            var transfer_station = stations["Bay Fair"]
            return routePeninsulaZone(this, dest, transfer_station, "Fremont", north_lines, south_lines)
        }
    })
    
    //-------------------------------------------------------------
    // Weird peninsula zones (prevent two-transfer trips from here)

    makeZone("Millbrae", {
        station_names: [ "San Bruno", "Millbrae" ],
        routeTo: function (dest) { 
            if (dest.isInZone("South SF") || dest.isInZone("Millbrae")) {
                return Route.parallelLegs(this, dest, [ "red_richmond", "yellow_pittsburg" ])
            }
            if (dest.isInZone("SFO")) {
                var xfer_route = routeThroughTransfer(this, dest, stations["San Bruno"])
                var direct_route = Route.leg(this, dest, "yellow_pittsburg")
                return Route.parallel(direct_route, xfer_route)
            }
            return routeThroughTransfer(this, dest, stations["Balboa Park"]);
        }
    })

    makeZone("SFO", {
        station_names: [ "San Bruno", "SFO" ],
        routeTo: function (dest) {
            if (dest.isInZone("South SF") || dest.isInZone("SFO")) {
                return Route.leg(this, dest, "yellow_pittsburg")
            }
            if (dest.isInZone("Millbrae")) {
                var xfer_route = routeThroughTransfer(this, dest, stations["San Bruno"])
                var direct_route = Route.leg(this, dest, "yellow_millbrae")
                return Route.parallel(direct_route, xfer_route)
            }
            return routeThroughTransfer(this, dest, stations["Balboa Park"]);
        }
    })
    
    //-------------------------------------------------------------
    // Fancy zones (two transfer stations each).
    
    makeZone("North Oakland", {
        station_names: [ "MacArthur", "19th St", "12th St" ],
        routeTo: function (dest) {
            var north_lines = ["red_richmond","orange_richmond","yellow_pittsburg"]
            var south_lines = ["red_millbrae","orange_fremont","yellow_millbrae"]
            if (dest.isInZone("North Oakland")) {
                return routeWithinZone(this, dest, "North Oakland", north_lines, south_lines)
            }
            return this.routeLikeMacArthurTo(dest)
        }
    })
    
    makeZone("San Francisco", {
        station_names:
            [ "West Oakland", "Embarcadero", "Montgomery", "Powell", "Civic Center",  
              "16th St", "24th St", "Glen Park", "Balboa Park" ],
        routeTo: function (dest) { 
            var north_lines = [ "red_richmond", "yellow_pittsburg", "green_fremont", "blue_dublin" ]
            var south_lines = [ "red_millbrae", "yellow_millbrae", "green_dalycity", "blue_dalycity" ]
    
            if (dest.isInZone("San Francisco")) {
                return routeWithinZone(this, dest, "San Francisco", north_lines, south_lines)
            }
            if (dest.isInZone("North Oakland")) {
                return Route.parallelLegs(this, dest, [ "red_richmond", "yellow_pittsburg" ])
            }
            if (dest.isInZone("South SF") || dest.isInZone("SFO") || dest.isInZone("Millbrae")) {
                return routeThroughTransfer(this, dest, stations["Balboa Park"])
            }
            
            var xfer_route_north = routeThroughTransfer(this, dest, stations["19th St"])
            var xfer_route_south = routeThroughTransfer(this, dest, stations["12th St"])
            if (dest.isInZone("Pittsburg") || dest.isInZone("Richmond")) {
                return xfer_route_north
            }
            if (dest.isInZone("South Oakland")) {
                var direct_route = Route.parallelLegs(this, dest, [ "green_fremont", "blue_dublin" ])
                return Route.parallel(xfer_route_south, direct_route)
            }
            if (dest.isInZone("Fremont")) {
                var direct_route = Route.parallelLegs(this, dest, [ "green_fremont" ])
                var direct_route_2 = Route.series(Route.leg(this, stations["Bay Fair"], "blue_dublin"),
                                                  stations["Bay Fair"].routeTo(dest))
                return Route.parallel(xfer_route_south, Route.parallel(direct_route, direct_route_2))
            }
            if (dest.isInZone("Dublin")) {
                return Route.parallelLegs(this, dest, [ "blue_dublin" ])
            }
        }
    })
    
    makeZone("South Oakland", {
        station_names:
            [ "Lake Merritt", "Fruitvale", "Coliseum", "San Leandro", "Bay Fair" ],
        routeTo: function (dest) {
            var north_lines = [ "orange_richmond", "green_dalycity", "blue_dalycity" ]
            var south_lines = [ "orange_fremont", "green_fremont", "blue_dublin" ]
    
            if (dest.isInZone("South Oakland")) {
                return routeWithinZone(this, dest, "South Oakland", north_lines, south_lines)
            }
            if (dest.isInZone("North Oakland")) {
                return Route.leg(this, dest, "orange_richmond")
            }
            if (dest.isInZone("Dublin")) {
                return Route.leg(this, dest, "blue_dublin")
            }
            if (dest.isInZone("Fremont")) {
                return Route.parallelLegs(this, dest, [ "orange_fremont", "green_fremont" ])
            }
            
            var xfer_route_north = routeThroughTransfer(this, dest, stations["19th St"])
            var xfer_route_south = routeThroughTransfer(this, dest, stations["12th St"])
            if (dest.isInZone("Pittsburg") || dest.isInZone("Richmond")) {
                return xfer_route_north
            }
            if (dest.isInZone("San Francisco")) {
                var direct_route = Route.parallelLegs(this, dest, [ "green_dalycity", "blue_dalycity" ])
                return Route.parallel(xfer_route_south, direct_route)
            }
            if (dest.isInZone("South SF") || dest.isInZone("Millbrae") || dest.isInZone("SFO")) {
                return routeThroughTransfer(this, dest, stations["Balboa Park"])
            }
        }
    })
    
    makeZone("South SF", {
        station_names: [ "Balboa Park", "Daly City", "Colma", "South SF", "San Bruno" ],
        routeTo: function (dest) {
            var north_lines = [ "red_richmond", "yellow_pittsburg", "green_fremont", "blue_dublin" ]
            var south_lines = [ "red_millbrae", "yellow_millbrae", "green_dalycity", "blue_dalycity" ]
            if (dest.isInZone("South SF")) {
                return routeWithinZone(this, dest, "South SF", north_lines, south_lines)
            }
            if (dest.isInZone("Millbrae")) {
                return Route.parallelLegs(this, dest, [ "yellow_millbrae", "red_millbrae" ]);
            }
            if (dest.isInZone("SFO")) {
                return Route.leg(this, dest, "yellow_millbrae");
            }
            return routeThroughTransfer(this, dest, stations["Balboa Park"]);
        }
    })

    //-------------------------------------------------------------
    // Transfer stations
    
    stations.MacArthur.routeTo = function (dest) {
        var lines = dest.isInZone("North Oakland") ? ["red_millbrae", "yellow_millbrae", "orange_fremont" ]
                  : dest.isInZone("Pittsburg")     ? ["yellow_pittsburg"]
                  : dest.isInZone("Richmond")      ? ["red_richmond", "orange_richmond" ]
                  : dest.isInZone("San Francisco") ? ["red_millbrae","yellow_millbrae"] 
                  : dest.isInZone("South Oakland") ? ["orange_fremont"]
                  : null
    
        if (lines) { return Route.parallelLegs(this, dest, lines) }
    
        var is_south_sf = dest.isInZone("South SF") || dest.isInZone("SFO") || dest.isInZone("Millbrae");
        var transfer_name = is_south_sf ? "Balboa Park" : "Bay Fair"
        return routeThroughTransfer(this, dest, stations[transfer_name])
    }
    
    stations["19th St"].routeLikeMacArthurTo = stations.MacArthur.routeTo
    stations["12th St"].routeLikeMacArthurTo = stations.MacArthur.routeTo
    
    stations["Bay Fair"].routeFromSouthOaklandTo = stations["San Leandro"].routeTo
    stations["Bay Fair"].routeTo = function (dest) {
        var lines = dest.isInZone("North Oakland") ? [ "orange_richmond" ]
                  : dest.isInZone("Richmond")      ? [ "orange_richmond" ]
                  : dest.isInZone("Dublin")        ? [ "blue_dublin" ]
                  : dest.isInZone("Fremont")       ? [ "orange_fremont", "green_fremont" ]
                  : null
    
        if (lines) { return Route.parallelLegs(this, dest, lines) }
        return this.routeFromSouthOaklandTo(dest)
    }
    
    stations["Balboa Park"].routeFromSanFranciscoTo = stations["24th St"].routeTo
    stations["Balboa Park"].routeTo = function (dest) {
        var south_lines = [ "red_millbrae", "yellow_millbrae", "green_dalycity", "blue_dalycity" ]
        var is_south_sf = dest.isInZone("South SF") || dest.isInZone("SFO") || dest.isInZone("Millbrae");

        if (is_south_sf) { return Route.parallelLegs(this, dest, south_lines) }
        return this.routeFromSanFranciscoTo(dest)
    }

    stations["San Bruno"].routeTo = stations["Colma"].routeTo;

}


//-------------------------------------------------------------
// Namer.  The red and yellow lines go by different names at
// different times.  Route.leg will call this function when
// scheduling to check whether the line has an alternate name.
//
Stations.getNamerForLine = function (line_name) {
    if (line_name == "blue_dublin") {
        return function (doesTrainGoToStation) {
            return doesTrainGoToStation("Dublin") ? "blue_dublin"
                 :                                  "blue_bayfair"
        }
    }
    if (line_name == "yellow_pittsburg") {
        return function (doesTrainGoToStation) {
            return doesTrainGoToStation("Pittsburg")  ? "yellow_pittsburg"
                 :                                      "yellow_concord"
        }
    }
    if (line_name == "yellow_millbrae") {
        return function (doesTrainGoToStation) {
            return doesTrainGoToStation("Millbrae")  ? "yellow_millbrae"
                 : doesTrainGoToStation("SFO")       ? "yellow_sfo"
                 : doesTrainGoToStation("Daly City") ? "yellow_dalycity"
                 : doesTrainGoToStation("24th St")   ? "yellow_24th"
                 :                                     "yellow_montgomery"
        }
    }
    if (line_name == "red_millbrae") {
        return function (doesTrainGoToStation) {
            return doesTrainGoToStation("Millbrae")  ? "red_millbrae"
                 :                                     "red_dalycity"
        }
    }

}


