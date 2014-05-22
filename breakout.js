

var username;
var names;
var participantIDs;



//TURN VARIABLES
var CANVAS_WIDTH;
var CANVAS_HEIGHT = 450;
var MIN_WIDTH = 300;

var isTurnReporter = false;
var lastReportedTurnID = null;

var THINK_PHASE_DURATION = 30000; // edit this to change time in each phase
var PAIR_PHASE_DURATION = 120000;

var counter;
var remaining_time_in_phase;
var thinkTimer;
var pairTimer;
var shareTimer;
var thinkPhaseInitialized = false;
var pairPhaseInitialized = false;
var sharePhaseInitialized = false;
var isModerator = false;

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
            //   startTPS();
            // });
            // $('#restart_discussion_btn').click(function() {
            //   restartTPS();
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
          }

          if (eventObj.state.phase == "pair") {
            startPairPhase();
          } else if (eventObj.state.phase == "share") {
            startSharePhase();
          }

          if (eventObj.state.intercom_in_use == "true") {
            turn_on_intercom();
          } else if (eventObj.state.intercom_in_use == "false") {
            turn_off_intercom();
          }

        }
      );


      // If the current participants are "administrators" (acting as instructors for the purposes of the demo), give them access to the Start/Stop discussion buttons
      var localParticipantId = gapi.hangout.getLocalParticipant().person.id;
      console.log("My local participant ID is: " + localParticipantId);
      if (localParticipantId == "111880716844037207883" || localParticipantId == "wjkchid@gmail.com" || localParticipantId == "kdumovic@gmail.com") {
        $("#start_tps_btn").show();
      }
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
function startTPS() {
  $("#start_tps_btn").hide();
  $("#enable_intercom_btn").show();
  $("#intercom_explanation").show();
  gapi.hangout.data.setValue("discussing","true");
  gapi.hangout.data.setValue("phase", "think");
};

function restartTPS() {
  // $("#start_discussion_btn").show();
  thinkPhaseInitialized = false;
  pairPhaseInitialized = false;
  sharePhaseInitialized = false;
  gapi.hangout.data.setValue("discussing","true");
  gapi.hangout.data.setValue("phase","think");
  console.log("restarting discussion");
};

function phase_timer(){
  remaining_time_in_phase=remaining_time_in_phase-1;
  if (remaining_time_in_phase <= 0)
  {
     clearInterval(counter);
     return;
  }
  if (remaining_time_in_phase <= 10) {
    $("#timer_label").addClass("phase_ending");
  }
  document.getElementById("timer_label").innerHTML=remaining_time_in_phase + " secs";
};

// Called by EVERY participant running the app to establish each person's timers/displays
function trigger_tps() {
  if (thinkPhaseInitialized == false) {
    // Control the button display for all participants
    $("#start_tps_button").hide();
    $("#restart_tps_button").hide();
    $("#pending_participants").hide();
    $("#instructions").hide();
    $("#timer_label").removeClass("phase_ending");

    var localParticipantId = gapi.hangout.getLocalParticipant().person.id;
    if (localParticipantId == "111880716844037207883" || localParticipantId == "wjkchid@gmail.com" || localParticipantId == "kdumovic@gmail.com") {
      isModerator = true;
    }

    console.log("I'm in the think phase!");
    console.log("Current time is: " + Date.now());

    $("#timer_wrapper").show();
    document.getElementById("phase_label").innerHTML = "Think<br/>On your own, think about your favorite class at Stanford. Why was it your favorite class?"

    // Start Think Phase
    remaining_time_in_phase = THINK_PHASE_DURATION/1000;
    counter=setInterval(phase_timer, 1000); //1000 will  run it every 1 second
    // var totalTime;
    thinkTimer = window.setTimeout(initiatePairPhase, THINK_PHASE_DURATION);
    thinkPhaseInitialized = true;
    if (isModerator == false) {
      hideAllButSelf();
    }
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
    gapi.hangout.data.setValue("discussing", "false");
  }
};

function notifySwitchSpeaker() {
  if (isModerator == false) {
    dispNotice("Half of the time in your pair discussion has passed! If you haven't done so already, make sure you switch off so that the other person has a chance to speak.");
  }
};

function startPairPhase() {
  if (pairPhaseInitialized == false) {
    window.clearTimeout(thinkTimer);
    window.clearInterval(counter);
    $("#timer_label").removeClass("phase_ending");

    console.log("I'm in the pair phase!");
    console.log("Current time is: " + Date.now());

    document.getElementById("phase_label").innerHTML = "Pair<br/>Now, with your partner, share which class you picked and why. What did you learn?"

    remaining_time_in_phase = PAIR_PHASE_DURATION/1000;
    counter=setInterval(phase_timer, 1000); //1000 will  run it every 1 second
    // var totalTime;
    var pairTimer = window.setTimeout(initiateSharePhase, PAIR_PHASE_DURATION);
    var halftimePairTimer = window.setTimeout(notifySwitchSpeaker, PAIR_PHASE_DURATION/2);
    
    if (isModerator == false) {
      hideAllButPair();
    } else {
      $("#pair_wrapper").show();
    }
  }
};

function startSharePhase() {
  if (sharePhaseInitialized == false) {
    window.clearTimeout(thinkTimer);
    window.clearInterval(counter);
    $("#timer_label").removeClass("phase_ending");


    if (isModerator == true) {
      $("#restart_tps_btn").show();
      // $("#graph_buttons").show();
      $("#intercom_explanation").hide();
      $("#enable_intercom_btn").hide();
      $("#disable_intercom_btn").hide();
      $("#pair_wrapper").hide();
      startGraphing();
    }
    $('#panel_container').css( "height", "+=300px" );

    document.getElementById("phase_label").innerHTML = "Share<br/>Now that we're all back, take turns going around and sharing what you discussed. Talk about your favorite classes."
    document.getElementById("timer_label").innerHTML= "Untimed"; // watch for spelling

    console.log("I'm in the share phase!");
    console.log("Current time is: " + Date.now());
    // Untimed!
    if (isModerator == false) {
      showAllParticipants();
    }
  }
};

function end_tps() {
  // Control the button display for all participants
  $("#end_discussion_btn").hide();
};

function activateIntercom() {
  $("#enable_intercom_btn").hide();
  $("#intercom_explanation").hide();
  $("#disable_intercom_btn").show();
  gapi.hangout.data.setValue("moderator", gapi.hangout.getLocalParticipantId());
  gapi.hangout.data.setValue("intercom_in_use", "true");
};

function disableIntercom() {
  $("#enable_intercom_btn").show();
  $("#intercom_explanation").show();
  $("#disable_intercom_btn").hide();
  gapi.hangout.data.setValue("intercom_in_use", "false");
};

function turn_on_intercom() {
  var moderator_id = gapi.hangout.data.getValue("moderator");
  gapi.hangout.av.setParticipantAudible(moderator_id, true);
};

function turn_off_intercom() {
  var moderator_id = gapi.hangout.data.getValue("moderator");
  gapi.hangout.av.setParticipantAudible(moderator_id, false);
};

function hideAllButSelf() {
  var participants = gapi.hangout.getParticipants();
  var local_participant = gapi.hangout.getLocalParticipantId();
  for (var index in participants) {
    var participant = participants[index];
    if (participant.id != local_participant) {
      gapi.hangout.av.setParticipantVisible(participant.id, false);
      gapi.hangout.av.setParticipantAudible(participant.id, false);
      gapi.hangout.av.setAvatar(participant.id, "https://raw.githubusercontent.com/jcambre/CS247-P4/hangouts/images/hidden.png");
    }
  }
};

function hideAllButPair() {
  var participants = gapi.hangout.getParticipants();
  var participantIDs = [];
  // get all of the ids
  for (var index in participants) {
    var participantId = participants[index].person.id;
    // Include all participants EXCEPT the instructor accounts.
    if (participantId != "111880716844037207883") {
      participantIDs.push(participants[index].id);
    }
  }
  //then sort them in ascending order
  participantIDs.sort();
  // Now find the partner for the local participant. If the participant's index is EVEN (0, 2), then their partner will be the person at their index + 1. If their index is ODD (1, 3) then their partner will be the person at their index - 1 
  var local_participant_id = gapi.hangout.getLocalParticipantId();
  var local_participant_index = participantIDs.indexOf(local_participant_id);
  var partner_id;
  
  console.log("local_participant_index: " + local_participant_index);
  console.log("Participants: ");
  console.log(participants);
  console.log(participantIDs);

  if (local_participant_index % 2 == 0) {
    // Their index is EVEN, so partner is index + 1
    partner_id = participantIDs[local_participant_index + 1];
  } else {
    // Their index is ODD, so partner is index - 1
    partner_id = participantIDs[local_participant_index - 1];
  }
  console.log("Partner ID:");
  console.log(partner_id);
  gapi.hangout.av.setParticipantVisible(partner_id, true);
  gapi.hangout.av.setParticipantAudible(partner_id, true);
  gapi.hangout.av.clearAvatar(partner_id);
};

function enableEavesdropping() {
  var participants = gapi.hangout.getParticipants();
  var participantIDs = [];
  // get all of the ids
  for (var index in participants) {
    var participantId = participants[index].person.id;
    // Include all participants EXCEPT the instructor accounts.
    if (participantId != "111880716844037207883") {
      participantIDs.push(participants[index].id);
    }
  }
  //then sort them in ascending order
  participantIDs.sort();
  // IF SUPPORTING UNEVEN NUM PARTICIPANTS, THIS WILL HAVE TO CHANGE
  while (participantIDs.length > 0) {
    var pair = participantIDs.splice(0, 2);
    var first_of_pair = gapi.hangout.getParticipantById(participantIDs[0]);
    var second_of_pair = gapi.hangout.getParticipantById(participantIDs[1]);
    var new_pair_item = "<li><button type='button' class='btn btn-default btn-xs' onclick='listenToPair(" + first_of_pair +", " + second_of_pair + ", this);'>";
    new_pair_item += first_of_pair.person.displayName + " & " + second_of_pair.person.displayName;
    new_pair_item += "</button></li>";
    $("#pairs").append(new_pair_item);
  }
  $("#pairs_wrapper").show();
};

function listenToPair(first_of_pair, second_of_pair, button) {
  // Hide everyone
  hideAllButSelf();

  // Redo classes
  $(button).siblings().removeClass("btn-success disabled").addClass("btn-default");
  $(button).addClass("btn-success disabled");

  // Set visibility
  gapi.hangout.av.setParticipantVisible(first_of_pair.id, true);
  gapi.hangout.av.setParticipantAudible(first_of_pair.id, true);
  gapi.hangout.av.clearAvatar(first_of_pair.id);

  gapi.hangout.av.setParticipantVisible(second_of_pair.id, true);
  gapi.hangout.av.setParticipantAudible(second_of_pair.id, true);
  gapi.hangout.av.clearAvatar(second_of_pair.id);
}

function listenToAll() {
  $("#listen_all").removeClass("btn-default").addClass("btn-success disabled");
  showAllParticipants();
}

function showAllParticipants() {
  var participants = gapi.hangout.getParticipants();
  for (var index in participants) {
    var participant = participants[index];
    gapi.hangout.av.setParticipantVisible(participant.id, true);
    gapi.hangout.av.setParticipantAudible(participant.id, true);
    gapi.hangout.av.clearAvatar(participant.id);
  }
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
  var num_needed_participants = 5 - (num_participants);
  if (num_needed_participants <= 0) {
    document.getElementById("pending_participants").innerHTML = "Looks like we're just about ready to go! Your discussion will begin momentarily.";
    $("#instructions").hide();
  } else {
    document.getElementById("num_participants_needed").innerHTML = num_needed_participants;
  }
};