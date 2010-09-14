//---------------------------------------------------------------------------
//  MiscUtils.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//---------------------------------------------------------------------------
//

//---------------------------------------------------------------
//  Object property methods.

function setProperties (obj,properties) {
    for (var key in properties) { obj[key] = properties[key] }
}

function isObjectEmpty (obj) {
    for (var key in obj) { return false }
    return true
}


//---------------------------------------------------------------
//  DOM methods.

function doesNodeAncestorHaveId (node, id) {
    while (node) {
        if (node.id == id) { return true }
        node = node.parentNode
    }
    return false
}


//---------------------------------------------------------------
//  Functional fundamentals.

function nullFunc (x) { }
function identityFunc (x) { return x }
