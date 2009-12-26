
..................................................Ride that train, baby....
 
                      T h e   B A R T   W i d g e t 

...........................................................................
                                                  Bret Victor
                                                  bret@worrydream.com
                                                  worrydream.com/bartwidget
Hello.  Welcome to my dashboard widget.
 
You are probably poking around inside this package because you want to 
modify it or base your own widget off of it.  Please do.  It was 
written to be read.  Feel free to email me any questions.

The code is licensed under the MIT license, which basically says that
I get the copyright and you get everything else.  The details have been
confined to license.txt, since they exceed the capslock limit of this
document.

Below is a table of contents for the Script directory.  Most files define
a class or package of the same name as the file.  Files marked with
an *sterisk contain data specifically related to the BART system; the
rest of the files should be fairly BART-agnostic.

...........................................................................

Top level:

  BART.js           View instantiations, event-handling, persistence.
  Test.js           Verification of the routing and scheduling systems.

Views (UI interaction):

  TitlebarView.js         Top of the widget.
  MapView.js              Drag around "to" and "from" on a map.
  MapbarView.js           Choose your favorite map.
  TripListView.js         See when the trains are coming.
  TimebarView.js          Set your date and time.
  BookmarksView.js        Jump to your favorite routes.  
  BottombarView.js        Bottom of the widget.
  SpeechBubbleView.js     Set up a voice announcement.
  SpeakingView.js         What you say?
  FlipsideView.js         Reverse side of the widget.
  UpdateAvailableView.js  Checks if a new version is available.

Additional UI utilities:

  DrawText.js             Faking text-drawing on a canvas.
  DrawTrain.js            Drawing train images.
  FolderUpper.js          Handles opening and closing the map and timebar views.

BART data:

* Fare.js                 Station-to-station fare calculation.  Generated.
* StationAddress.js       Station street addresses for Googlemapping.
* Timetables.js           When the trains arrive where.  Generated.

Routing and scheduling:

* Stations.js             Representation of the train network.  All 
                          routing logic is here.
  Route.js                Representation of all paths from one station to
                          another.  All scheduling logic is here.
  Trip.js                 Representation of a scheduled trip from one
                          station to another.
  TripList.js             Infinite list of a series of trips.

General-purpose utilities:

  BackgroundAction.js     Cancelable deferred actions.
  Ramp.js                 Generator for time-dependent effects.
  ArrayUtils.js           Array utility functions.
  DateUtils.js            Date-manipulation utility functions.
  SearchUtils.js          Binary search utility functions.
  DrawUtils.js            Canvas drawing utility functions.
  MiscUtils.js            Miscellaneous utility functions.
  Excuses.js              Murphy's Law enumeration.

Code generator:

  make_timetables.pl      Perl script to generate Timetables.js.
  make_fare.pl            Perl script to generate Fare.js.

...........................................................................

In particular, I urge you to add BackgroundAction and Ramp to your 
toolbox, and then never use setInterval again.

Please note that most of the interesting UI is done with canvas
elements, so if you came here looking for fancy DHTML craziness,
you won't find it.  But you will find an alternative to all that
CSS/DOM hacking and butchering that you're used to, and that may
prove enlightening.

Happy hacking!

...........................................................................
 copyright (c) 2005 Bret Victor, and the feet that never take me home.
