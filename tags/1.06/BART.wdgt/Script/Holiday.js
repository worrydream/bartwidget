//-----------------------------------------------------------------------------
//  Holiday.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  Service Levels -- http://www.bart.gov/guide/holidays.aspx
//
//  Automatically generated by make_holiday.pl on Mon Nov 22 10:09:17 2010.
//

function Holiday () {

    servicelevel = {}
    servicelevel['11/25/2010'] = 'sunday'
    servicelevel['12/25/2010'] = 'sunday'
    servicelevel['01/01/2011'] = 'sunday'
    servicelevel['01/17/2011'] = 'saturday'
    servicelevel['02/21/2011'] = 'saturday'
    servicelevel['05/30/2011'] = 'sunday'
    servicelevel['07/04/2011'] = 'sunday'
    servicelevel['09/05/2011'] = 'sunday'
    servicelevel['11/24/2011'] = 'sunday'
    
    Holiday.getServiceLevel = function(date) {
        var date_string = date.toMMDDYYYYString()
        var day_of_week = date.getDay()
        
        return servicelevel[date_string] ||
            ( (day_of_week == 0)        ? 'sunday'
            : (day_of_week == 6)        ? 'saturday'
            :                             'weekday')
    }
}

// Open the package.
Holiday();
