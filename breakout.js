

var username;
var names;
var current_participant;
var participantIDs;



//TURN VARIABLES
var CANVAS_WIDTH;
var CANVAS_HEIGHT = 450;
var MIN_WIDTH = 300;

var isTurnReporter = false;
var lastReportedTurnID = null;

var counter;
var remaining_time_in_phase;
var thinkTimer;
var pairTimer;
var shareTimer;
var thinkPhaseInitialized = false;
var pairPhaseInitialized = false;
var sharePhaseInitialized = false;

// TURN-TAKING STARTS HERE

// Wait for gadget to load.
gadgets.util.registerOnLoadHandler(init);

function init() {
  // When API is ready...                                                         
  gapi.hangout.onApiReady.add(
    function(eventObj) {
      if (eventObj.isApiReady) {
          gapi.hangout.layout.setChatPaneVisible(false);
          setCanvas();
          setNumParticipantsNeeded();
      }

      $(window).resize(function () {
          recenterCanvas();
      });

      //Listen for future changes to enabled/disabled participants to see if local participant becomes turn reporter
      gapi.hangout.onEnabledParticipantsChanged.add(
        function(eventObj) {
        }
      );

      $(window).resize(function () {
          recenterCanvas();
      });

      //Listen for future changes to enabled/disabled participants to see if local participant becomes turn reporter
      gapi.hangout.onEnabledParticipantsChanged.add(
        function(eventObj) {
        }
      );

      gapi.hangout.onParticipantsAdded.add(
        function(eventObj) {
        }
      );        

      gapi.hangout.onParticipantsRemoved.add(
        function(eventObj) {
        }
      ); 

      gapi.hangout.onParticipantsChanged.add(
        function(eventObj) {
          if (eventObj.participants.length == 4) {
            // MAKE SURE TO UN_COMMENT THIS!!
            // $('#start_discussion_btn').toggleClass("disabled");
            // $('#start_discussion_btn').click(function() {
            //   startDiscussion();
            // });
            // $('#end_discussion_btn').click(function() {
            //   endDiscussion();
            // });
          }
          setNumParticipantsNeeded();
        }
      );

      // Update the display for the *other* participants in response to one person clicking the start/stop 
      gapi.hangout.data.onStateChanged.add(
        function(eventObj) {
          if (eventObj.state.discussing == "true") {
            trigger_tps();
          } else if (eventObj.state.discussing == "false") {
            end_tps();
          }

          if (eventObj.state.phase == "pair") {
            startPairPhase();
          } else if (eventObj.state.phase == "share") {
            startSharePhase();
          }
        }
      );
    }
  );
};





////////////////////////////////////
/// ALL DISPLAY LOGIC GOES BELOW ///
////////////////////////////////////
function hidePanel() {
  $("#panel_container").hide();
  $("#show_panel").show();
  recenterCanvas();
};

function showPanel() {
  $("#panel_container").show();
  $("#show_panel").hide();
  recenterCanvas();
};

// This is called ONLY by a local participant who initiates the discussion
function startDiscussion() {
  gapi.hangout.data.setValue("discussing","true");
  gapi.hangout.data.setValue("phase", "think");
  trigger_tps();
};

function endDiscussion() {
  // $("#start_discussion_btn").show();
  gapi.hangout.data.setValue("discussing","false");
  end_tps();
};

function timer(){
  remaining_time_in_phase=remaining_time_in_phase-1;
  if (remaining_time_in_phase <= 0)
  {
     clearInterval(counter);
     return;
  }
  document.getElementById("timer_label").innerHTML=remaining_time_in_phase + " secs"; // watch for spelling
};

// Called by EVERY participant running the app to establish each person's timers/displays
function trigger_tps() {
  if (thinkPhaseInitialized == false) {
    // Control the button display for all participants
    $("#start_discussion_btn").hide();
    $("#end_discussion_btn").show();

    console.log("I'm in the think phase!");
    console.log("Current time is: " + Date.now());

    document.getElementById("phase_label").innerHTML = "Think"

    // Start Think Phase
    var phase_duration = 30000;
    remaining_time_in_phase = phase_duration/1000;
    counter=setInterval(timer, 1000); //1000 will  run it every 1 second
    // var totalTime;
    thinkTimer = window.setTimeout(initiatePairPhase, phase_duration);
    thinkPhaseInitialized = true;
  }  
};

// Called ONLY BY THE FIRST PERSON whose timer reaches the pair phase!
function initiatePairPhase() {
  if (gapi.hangout.data.getValue("phase") !== "pair") {
    gapi.hangout.data.setValue("phase", "pair");
  }
};

// Called ONLY BY THE FIRST PERSON whose timer reaches the share phase!
function initiateSharePhase() {
  if (gapi.hangout.data.getValue("phase") !== "share") {
    gapi.hangout.data.setValue("phase", "share");
  }
};

function startPairPhase() {
  if (pairPhaseInitialized == false) {
    window.clearTimeout(thinkTimer);
    window.clearInterval(counter);

    console.log("I'm in the pair phase!");
    console.log("Current time is: " + Date.now());

    document.getElementById("phase_label").innerHTML = "Pair"

    var phase_duration = 60000;
    remaining_time_in_phase = phase_duration/1000;
    counter=setInterval(timer, 1000); //1000 will  run it every 1 second
    // var totalTime;
    var pairTimer = window.setTimeout(initiateSharePhase, phase_duration);
  }
};

function startSharePhase() {
  if (sharePhaseInitialized == false) {
    window.clearTimeout(thinkTimer);
    window.clearInterval(counter);

    document.getElementById("phase_label").innerHTML = "Share"

    console.log("I'm in the share phase!");
    console.log("Current time is: " + Date.now());
    // Untimed!
  }
};


function end_tps() {
  // Control the button display for all participants
  $("#end_discussion_btn").hide();
};

//LAYOUT AND VIDEO FEED CONTROLS:

// NOTE: This function was derived from Julia Cambre's work on Talkabout 
function setCanvas() {
  var feed = gapi.hangout.layout.getDefaultVideoFeed();
  var canvas = gapi.hangout.layout.getVideoCanvas();
  var newSize = canvas.setHeight(CANVAS_HEIGHT);
  CANVAS_WIDTH = newSize.width
  canvas.setVideoFeed(feed);
  canvas.setVisible(true);
  var leftOffset = 40;
  if ($("#panel_container").is(":visible")) {
    leftOffset += $("#panel_container").width();
  }
  canvas.setPosition(leftOffset, 45);
  recenterCanvas();
};

// NOTE: This function was derived from Julia Cambre's work on Talkabout 
function recenterCanvas() {
  var canvas = gapi.hangout.layout.getVideoCanvas();
  canvas.setVisible(false);
  var effectiveWidth = 0;
  if ($("#panel_container").is(":visible") || $(".misconduct").is(":visible")) {
    effectiveWidth += 380;
  }
  CANVAS_WIDTH = Math.max($("#container").width() - effectiveWidth - 40, MIN_WIDTH);
  var newSize = canvas.setWidth(CANVAS_WIDTH);
  CANVAS_HEIGHT = newSize.height;
  var maxheight = $(window).height()-30;
  if (CANVAS_HEIGHT > maxheight) {
    CANVAS_HEIGHT -= 30;
    newSize = canvas.setHeight(maxheight);
    CANVAS_WIDTH = newSize.width;
  }
  var leftOffset = 40;
  if ($("#panel_container").is(":visible") || $(".misconduct").is(":visible")) {
    leftOffset += 380;
  } else {
    leftOffset = ($(window).width() - CANVAS_WIDTH)/2;
  }
  canvas.setPosition(leftOffset, 0);
  canvas.setVisible(true);
  // $("#panel_container").height(CANVAS_HEIGHT);
};

function setNumParticipantsNeeded() {
  var num_participants = gapi.hangout.getParticipants().length;
  var num_needed_participants = 4 - (num_participants);
  if (num_needed_participants <= 0) {
    document.getElementById("num_participants_needed").innerHTML = "You're all set for your discussion! Whenever everyone is ready, have someone click the \"Start Discussion\" button to initiate the discussion.";
  } else {
    document.getElementById("num_participants_needed").innerHTML = num_needed_participants;
  }
};