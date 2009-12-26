//---------------------------------------------------------------------------
//  Excuses.js is part of the BART dashboard widget.    (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//---------------------------------------------------------------------------
//
//  If this is wrong, I don't want to be right.
//

function Excuses () {

    this.getExcuse = getFreshExcuse


    //-------------------------------------------------
    //  Excuse lists.

    var reasonable_excuses = getReasonableExcuses()
    var silly_excuses      = getSillyExcuses()
    var outlandish_excuses = getOutlandishExcuses()


    //-------------------------------------------------
    //  Excuse-choosing.  Gotta keep it fresh.

    var num_previous_excuses = 16

    var previous_excuses = {}
    var excuse_count = 0
    
    function getFreshExcuse () {
        var excuses = getExcuseList()
        var excuse
        do { excuse = getExcuseFromList(excuses) }
        while (hasExcuseBeenUsedRecently(excuse))
        
        previous_excuses[excuse_count % num_previous_excuses] = excuse
        excuse_count++
        return excuse
    }

    function hasExcuseBeenUsedRecently (excuse) {
        for (var i=0; i < num_previous_excuses; i++) {
            if (previous_excuses[i] == excuse) { return true }
        }
    }
    
    function getExcuseFromList (excuses) {
        return excuses[ Math.floor(getRandomInteger(excuses.length)) ]
    }
    
    function getExcuseList () {
        var probabilities = (excuse_count <  3) ? [ 10, 0, 0 ]
                          : (excuse_count <  6) ? [  5, 5, 0 ]
                          : (excuse_count < 12) ? [  0, 9, 1 ]
                          : (excuse_count < 22) ? [  0, 7, 3 ]   
                          :                       [  0, 4, 6 ]
        var random_num = getRandomInteger(10)
        return (random_num < probabilities[0])                    ? reasonable_excuses
             : (random_num < probabilities[0] + probabilities[1]) ? silly_excuses
             :                                                      outlandish_excuses
    }
    
    
    //-------------------------------------------------
    //  Random number generation.  Math.random() is
    //  supposed to be seeded by the current time, but
    //  it kept starting from the same place.  Since
    //  there's no direct way to provide a seed, I
    //  just use a custom generator.
    
    var random_seed = getRandomSeed()
    
    function getRandomSeed () {
        var date = dateNow()
        return date.getTime() % 65521
    }
    
    function getRandomInteger (size) {
        random_seed = ((random_seed * 31421) + 1) % 65535
        return Math.floor(size * (random_seed/65536))
    }
    

    //-------------------------------------------------
    //  Ha-ha!
    
    function getReasonableExcuses () {
        return [
            "rainstorms",
            "weather conditions",
            "track maintanance",
            "heavy wind",
            "police activity",
            "renovation",
            "overcrowding",
            "frost",
            "fog",
            "power outages"
        ]
    }
    
    function getSillyExcuses () {
        return [
            "software failure",
            "flux capacitor leakage",
            "wheel regreasing",
            "power surges",
            "unforeseen neutrino emmisions",
            "excessive line noise",
            "train operator boredom",
            "electricity shortages",
            "barnacles",
            "termites",
            "quicksand",
            "glaciers",
            "flooding",
            "toxic flora",
            "gamma rays",
            "alpha particles",
            "negligence",
            "parking meter expiration",
            "volcanic eruption",
            "global magnetic reversal",
            "lack of sleep",
            "intoxication",
            "killer bees",
            "plague",
            "fleas",
            "station foreclosure",
            "labor disputes",
            "infinite recursion"
        ]
    }
    
    function getOutlandishExcuses () {
        return [
            "wolverine estrus cycles",
            "particularly engrossing episodes of The Simpsons",
            "spotted owl habitat preservation",
            "swampland restoration",
            "nearby open-mic nights",
            "Hayao Miyazaki openings",
            "Scrabble championships",
            "bear sightings",
            "unexpected planet-hacking",
            "lack of imagination",
            "diabolical fiddle competitions",
            "flaky, tender crust",
            "quantum tunnelling",
            "gravitational constant reevaluation",
            "repeal of Maxwell's laws",
            "photon reduction legislation",
            "cattle crossing",
            "truth-beauty inequality",
            "whale-watching tours",
            "dust mites",
            "coal mining",
            "cow tipping",
            "stampedes",
            "pancreatic rupturing",
            "the death of irony",
            "hornswaggling",
            "precocious youngsters",
            "kids these days",
            "skirt season",
            "ring around the collar",
            "smallpox outbreaks",
            "overly spicy curry",
            "Barko, the Wonder Dog",
            "Scratcho, the Wonder Cat",
            "Squirto, the Wonder Squid"
        ]
    }
    
}

