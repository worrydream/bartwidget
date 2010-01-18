//--------------------------------------------------------------------------------
//  Ramp.js is part of the BART dashboard widget.       (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//--------------------------------------------------------------------------------
//
//  The Ramp class provides an output that transitions from 0 to 1, or 
//  vice-versa, over time.  Many time-dependent effects, such as rollover
//  fading and smooth resizing, can be easily implemented by plugging an
//  appropriate setter function into a Ramp.
//
//  ramp = new Ramp( function (v) { fade_me_out.style.opacity = v } )
//  ramp.setTime(200)  // Time from 0 to 1, in ms.
//  ramp.setDirection("up")    // Starts ramping upwards.
//  ramp.setDirection("down")  // Turns around and ramps downwards.
//

function Ramp (setOutput) {

    //---------------------------------------------------------
    //  Constants.

    var epsilon = 1e-6

    //---------------------------------------------------------
    //  Variables.

    var time = 200  // ms (default)
    var direction = "stopped"
    var output = 0
    var is_warped = false
    var is_running = false

    //---------------------------------------------------------
    //  Private functions.

    function disableTimer () {
        direction = "stopped"
        if (is_running == false) { return }
        Ramp.run_queue.removeFunction(timerFunc)
        is_running = false
    }

    function enableTimer () {
        if (is_running == true) { return }
        Ramp.run_queue.addFunction(timerFunc)
        is_running = true
    }

    function enableOrDisableTimer () {
        if      (direction == "up" && output == 1)   { disableTimer() }
        else if (direction == "down" && output == 0) { disableTimer() }
        else                                         { enableTimer()  }
    }

    function timerFunc () {
        var doutput = Ramp.delta_time / time
        if (direction == "down") { doutput = -doutput }
        output = clamp(output + doutput)
        if (output == 0 || output == 1) { disableTimer() }
        
        var value_to_send = is_warped ? warp(output) : output
        setOutput(value_to_send)       // setOutput is allowed to re-enable the timer.
    }

    function clamp (v) {
        return (v < epsilon)   ? 0
             : (v > 1-epsilon) ? 1
             :                   v
    }

    function warp (v) {
        return (1 - Math.cos(Math.PI * v)) / 2
    }


    //---------------------------------------------------------
    //  Public functions.

    this.setTime = function (t) { time = t }

    this.setOutput = function (v) { 
        if (v == output) { return }
        output = v 
        enableOrDisableTimer()
    }
    
    this.setDirection = function (d) {
        if (d == direction) { return }
        direction = d
        enableOrDisableTimer()
    }

    this.setIsWarped = function (v) {
        is_warped = v
    }
    
    // Force an immediate update.
    this.update = function () {
        setOutput(output)
    }
}

// Static properties.
Ramp.delta_time = 25  // ms
Ramp.run_queue = new RunQueue(Ramp.delta_time, 
    function () { bart.fireEvent({ type:"bart_rampBeginTick" }) },
    function () { bart.fireEvent({ type:"bart_rampEndTick"   }) }
)


//---------------------------------------------------------
//  Run Queue.  Give it a function, and it will call it
//  on a regular basis.

function RunQueue (delta_time, beginTick, endTick) {

    var timer = undefined
    var functions = []
    var currently_running_index = undefined
    
    this.addFunction = function (func) {
        functions.push(func)
        timer = timer || window.setInterval(runFunctions, delta_time)
    }

    this.removeFunction = function (func) {
        var index = findIndex(functions, func)
        if (index == undefined) { return }

        functions.splice(index, 1)
        if (currently_running_index != undefined && currently_running_index >= index) {
            currently_running_index--
        }
        if (functions.length == 0 && timer) { 
            window.clearInterval(timer)
            timer = undefined
        }
    }
    
    function runFunctions () {
        beginTick()
        for (currently_running_index = 0; currently_running_index < functions.length; 
                                          currently_running_index++) {
            var func = functions[currently_running_index]
            func()
        }
        currently_runnning_index = undefined
        endTick()
    }
}

