//----------------------------------------------------------------------------------
//  BackgroundAction.js is part of the BART dashboard widget.  (c) 2005 Bret Victor
//  This software is licensed under the terms of the open source MIT license.
//---------------------------------------------------------------------------------
//
//  background_action = new BackgroundAction(1000)  // ms
//  background_action.set( function () { return shouldWeContinue() } )
//  background_action.cancel()
//
//  The BackgroundAction class is used to postpone an action until some activity
//  has died down.  Each time set() is invoked, the clock is reset.  The function
//  provided to set() is not executed until defer_time_ms elapses without set() 
//  being called.
//
//  The provided function will be called repeatedly until it returns untrue, unless
//  another set() or cancel() is invoked in the meantime.  This gives the means to
//  do a lame sort of background threading, as long as you manage your own state.
//  Oh, what I wouldn't give for a coroutine about now.
//
//  If you provide a function that never returns true (such as one with no return
//  statement), you effectively get a cancellable deferred one-shot action, which
//  can be handy.
//
function BackgroundAction (defer_time_ms) {
    var timer
    
    function cancel () {
        if (timer) {
            window.clearInterval(timer)
            timer = undefined
        }
    }

    function set (func) {
        cancel()
        timer = window.setInterval(function () {
            if ( ! func() ) { cancel() }
        }, defer_time_ms)
    }
    
    this.cancel = cancel
    this.set = set
}

//
//  background_queue = new BackgroundQueue()
//  background_queue.add( 100 /* ms */, function () { foo() } )
//  background_queue.add( 100 /* ms */, function () { bar() } )
//    // foo() will be called on the next event loop.  bar() will be called 100 ms later.
//
function BackgroundQueue () {
    var timer
    var functions = []
    
    function onTimeout () {
        timer = undefined
        var func = functions.shift()
        if (func) { func() }
    }
    
    this.add = function (wait_time_ms, func) {

        function runUserFunctionAndScheduleTimeout () {
            defer(func)
            timer = window.setTimeout(onTimeout, wait_time_ms)
        }
    
        if (timer) { functions.push(runUserFunctionAndScheduleTimeout) }
        else {       runUserFunctionAndScheduleTimeout() }
    }

}

function defer (func) {
    window.setTimeout(func, 0)
}
