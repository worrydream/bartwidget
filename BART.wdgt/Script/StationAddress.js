//--------------------------------------------------------------------------------
//  StationAddress.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//--------------------------------------------------------------------------------
//
//  address = StationAddress.getByName("Del Norte")
//

function StationAddress () {

    var addresses = {}
    
    StationAddress.getByName = function (name) {
        return addresses[name]
    }
    
    function addAddress (name, address) {
        addresses[name] = address
    }

    addAddress("Civic Center", "1150 Market Street,  San Francisco, CA 94102")
    addAddress("North Concord", "3700 Port Chicago Highway,  Concord, CA 94520")
    addAddress("West Dublin", "6501 Golden Gate Drive,  Dublin, CA 94568")
    addAddress("Dublin", "5801 Owens Dr.,  Pleasanton, CA 94588")
    addAddress("Orinda", "11 Camino Pablo,  Orinda, CA 94563")
    addAddress("Plaza", "6699 Fairmont Avenue,  El Cerrito, CA 94530")
    addAddress("Hayward", "699 'B' Street,  Hayward, CA 94541")
    addAddress("Castro Valley", "3301 Norbridge Ave.,  Castro Valley, CA 94546")
    addAddress("Walnut Creek", "200 Ygnacio Valley Rd.,  Walnut Creek, CA 94596")
    addAddress("Fruitvale", "3401 East 12th Street,  Oakland, CA 94601")
    addAddress("12th St", "1245 Broadway,  Oakland, CA 94602")
    addAddress("MacArthur", "555 40th Street,  Oakland, CA 94609")
    addAddress("Embarcadero", "298 Market Street,  San Francisco, CA 94105")
    addAddress("West Oakland", "1451 7th Street,  Oakland, CA 94607")
    addAddress("Powell", "899 Market Street,  San Francisco, CA 94105")
    addAddress("19th St", "1900 Broadway,  Oakland, CA 94602")
    addAddress("Pittsburg", "1700 West Leland Rd.,  Pittsburg, CA 94565")
    addAddress("16th St", "2000 Mission Street,  San Francisco, CA 94110")
    addAddress("Coliseum", "7200 San Leandro St.,  Oakland, CA 94612")
    addAddress("SFO", "37.61658 -122.39180")
    addAddress("Pleasant Hill", "1365 Treat Blvd.,  Walnut Creek, CA 94597")
    addAddress("Lake Merritt", "800 Madison Street,  Oakland, CA 94607")
    addAddress("San Leandro", "1401 San Leandro Blvd.,  San Leandro, CA 94577")
    addAddress("Millbrae", "200 North Rollins Road,  Millbrae, CA 94030")
    addAddress("Colma", "365 D Street,  Colma, CA 94014")
    addAddress("South Hayward", "28601 Dixon Street,  Hayward, CA 94544")
    addAddress("Concord", "1451 Oakland Avenue,  Concord, CA 94520")
    addAddress("Lafayette", "3601 Deer Hill Road,  Lafayette, CA 94549")
    addAddress("South SF", "1333 Mission Road,  South San Francisco, CA 94080")
    addAddress("24th St", "2800 Mission Street,  San Francisco, CA 94110")
    addAddress("Rockridge", "5660 College Avenue,  Oakland, CA 94618")
    addAddress("Balboa Park", "401 Geneva Avenue,  San Francisco, CA 94112")
    addAddress("Bay Fair", "15242 Hesperian Blvd.,  San Leandro, CA 94578")
    addAddress("Daly City", "500 John Daly Blvd.,  Daly City, CA 94014")
    addAddress("Del Norte", "6400 Cutting Blvd.,  El Cerrito, CA 94530")
    addAddress("Union City", "10 Union Square,  Union City, CA 94587")
    addAddress("Glen Park", "2901 Diamond Street,  San Francisco, CA 94131")
    addAddress("North Berkeley", "1750 Sacramento Street,  Berkeley, CA 94702")
    addAddress("Berkeley", "2160 Shattuck Avenue,  Berkeley, CA 94704")
    addAddress("Montgomery", "598 Market Street,  San Francisco, CA 94105")
    addAddress("San Bruno", "1151 Huntington Avenue,  San Bruno, CA 94066")
    addAddress("Richmond", "1700 Nevin Avenue,  Richmond, CA 94801")    // Incorrect?  Google no like.
    addAddress("Fremont", "2000 BART Way,  Fremont, CA 94536")
    addAddress("Ashby", "3100 Adeline Street,  Berkeley, CA 94703")
}

// Open the package.
StationAddress();

