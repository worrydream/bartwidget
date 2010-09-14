//-----------------------------------------------------------------------------
//  ArrayUtils.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------
//
//  Array-related functions.
//

function findIndex (array,item) {      
    for (var i = 0; i < array.length; i++) {
        if (array[i] == item) { return i }
    }
}

// If func returns a value, the iteration is terminated and the
// value is returned from the foreach.  Like Lua's table.foreach.
function foreach (array,func) {
    for (var i = 0; i < array.length; i++) { 
        var result = func(array[i])
        if (result) { return result }
    }
}

function foreachNotBeforeItem (array,item,func) {
    var is_item_found = false
    for (var i = 0; i < array.length; i++) { 
        var m = array[i]
        is_item_found = is_item_found || (m == item)
        if (is_item_found) {
            var result = func(m)
            if (result) { return result }
        }
    }
}

function foreachAfterItem (array,item,func) {
    var is_item_found = false
    for (var i = 0; i < array.length; i++) { 
        var m = array[i]
        if (is_item_found) { 
            var result = func(m)
            if (result) { return result }
        }
        is_item_found = is_item_found || (m == item)
    }
}

