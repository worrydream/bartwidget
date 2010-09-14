//-----------------------------------------------------------------------------
//  SearchUtils.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//-----------------------------------------------------------------------------

var floor = Math.floor

function isInteger (number) {
    return number == floor(number)
}

//--------------------------------------------------------------------
//  Binary searches.  Sorry about the duplication.  I sure wish
//  JavaScript allowed multiple return values (without having to
//  construct an Array.)
//

//  Assuming array is ordered and value doesn't appear multiple times in the array:
//    index = getIndexOfSmallerOrEqualValue(array,value)
//    assert( array[index-1] <  value )
//    assert( array[index]   <= value )
//    assert( array[index+1] >  value )
function getIndexOfSmallerOrEqualValue (array, value) {
    var low = 0
    var high = array.length - 1
    while (low <= high) {
        var middle = (low + high) >> 1
        var middle_value = array[middle]
        if (middle_value == value) { return middle }
        if (middle_value > value)  { high = middle - 1 }
        else                       { low  = middle + 1 }
    }
    return high     // lower bound
}

//  Assuming array is ordered and value doesn't appear multiple times in the array:
//    index = getIndexOfLargerOrEqualValue(array,value)
//    assert( array[index-1] <  value )
//    assert( array[index]   >= value )
//    assert( array[index+1] >  value )
function getIndexOfLargerOrEqualValue (array, value) {
    var low = 0
    var high = array.length - 1
    while (low <= high) {
        var middle = (low + high) >> 1
        var middle_value = array[middle]
        if (middle_value == value) { return middle }
        if (middle_value > value)  { high = middle - 1 }
        else                       { low  = middle + 1 }
    }
    return low     // upper bound
}


//--------------------------------------------------------------------
//  Sliding an index to find an integer.
//

//   new_index = findIntegerByDecrementingIndex(array,index)
//   if (new_index != undefined) {
//     assert( new_index < index )
//     assert( isInteger(array[new_index]) )
//   }
function findIntegerByDecrementingIndex (array, index) {
    var value_at_index
    do {
        --index
        if (index < 0) { return undefined }
        value_at_index = array[index]
    } while (value_at_index != floor(value_at_index))
    return index
}

//   new_index = findIntegerByIncrementingIndex(array,old_index)
//   if (new_index != undefined) {
//     assert( new_index > old_index )
//     assert( isInteger(array[new_index]) )
//   }
function findIntegerByIncrementingIndex (array, index) {
    var value_at_index
    do {
        ++index
        if (index >= array.length) { return undefined }
        value_at_index = array[index]
    } while (value_at_index != floor(value_at_index))
    return index
}


//--------------------------------------------------------------------
//  Binary searches to find an integer.
//

//   index = getIndexOfSmallerOrEqualInteger(array, value)
//   if (index != undefined) {
//     assert( array[index] <= value )
//     assert( isInteger(array[index]) )
//   }
function getIndexOfSmallerOrEqualInteger (array, value) {
    var index = getIndexOfSmallerOrEqualValue(array,value)
    var value_at_index = array[index]
    if (value_at_index == undefined) { return undefined }   // value is too small.
    if (value_at_index != floor(value_at_index)) {
        return findIntegerByDecrementingIndex(array,index)
    }
    return index
}

//   index = getIndexOfLargerOrEqualInteger(array, value)
//   if (index != undefined) {
//     assert( array[index] >= value )
//     assert( isInteger(array[index]) )
//   }
function getIndexOfLargerOrEqualInteger (array, value) {
    var index = getIndexOfLargerOrEqualValue(array,value)
    var value_at_index = array[index]
    if (value_at_index == undefined) { return undefined }   // value is too large.
    if (value_at_index != floor(value_at_index)) {
        return findIntegerByIncrementingIndex(array,index)
    }
    return index
}

//   index = getIndexOfSmallerInteger(array, value)
//   if (index != undefined) {
//     assert( array[index] < value )
//     assert( isInteger(array[index]) )
//   }
function getIndexOfSmallerInteger (array, value) {
    var index = getIndexOfSmallerOrEqualInteger(array,value)
    if (array[index] == value) { return findIntegerByDecrementingIndex(array,index) }
    return index
}

//   index = getIndexOfLargerInteger(array, value)
//   if (index != undefined) {
//     assert( array[index] > value )
//     assert( isInteger(array[index]) )
//   }
function getIndexOfLargerInteger (array, value) {
    var index = getIndexOfLargerOrEqualInteger(array,value)
    if (array[index] == value) { return findIntegerByIncrementingIndex(array,index) }
    return index
}

