  var CANVAS_WIDTH;
  var CANVAS_HEIGHT = 450;
  var MIN_WIDTH = 300;

  var isTurnReporter = false;
  var lastReportedTurnID = null;

  // Wait for gadget to load.
  gadgets.util.registerOnLoadHandler(init);

  function init() {
    // When API is ready...                                                         
    gapi.hangout.onApiReady.add(
      function(eventObj) {
        if (eventObj.isApiReady) {
            gapi.hangout.layout.setChatPaneVisible(false);
            setCanvas();
        }

        $(window).resize(function () {
            recenterCanvas();
        });

        //Determine whether the just-added local participant is a turn reporter (there are two per session)
        listenForTurnReporting();

        //Listen for future changes to enabled/disabled participants to see if local participant becomes turn reporter
        gapi.hangout.onEnabledParticipantsChanged.add(
          function(eventObj) {
            listenForTurnReporting();
          }
        );

        gapi.hangout.onParticipantsAdded.add(
          function(eventObj) {
            addParticipantsToGraph(eventObj.addedParticipants);
          }
        );        

        gapi.hangout.onParticipantsRemoved.add(
          function(eventObj) {
            removeParticipantsFromGraph(eventObj.removedParticipants);
          }
        ); 
      }
    );
  };

  function listenForTurnReporting() {
    determineReporters();
    if (isTurnReporter) {
      gapi.hangout.layout.getDefaultVideoFeed().onDisplayedParticipantChanged.add(
        function(eventObj) {
          trackTurns(eventObj);
        }
      );
    } else {
      lastReportedTurnID = null; //reset the last reported ID to null in preparation for the next time we're turn reporter
      gapi.hangout.layout.getDefaultVideoFeed().onDisplayedParticipantChanged.remove(
        function(eventObj) {
          trackTurns(eventObj);
        }
      );
    }
  };

  function trackTurns(eventObj) {
    console.log(eventObj)
    var participant = gapi.hangout.getParticipantById(eventObj.displayedParticipant);
    var participantID = participant.person.id;

    //Only report if I have not already reported seeing this same participant
    if (participantID != lastReportedTurnID) {
      //Report data back to the server. Send displayed participant's NAME & ID, reporter's ID **for each reporter**
      reportTurnTakingEvent(participantID);
    }
    lastReportedTurnID = participantID;
  };

  //This function is called any time a participant enables or disables the app, in order to update whether the local participant is the turn-taking reporter
  function determineReporters() {
    var enabledParticipants = gapi.hangout.getEnabledParticipants();
    var localParticipantID = gapi.hangout.getLocalParticipant().person.id;
    var lowestID = localParticipantID;
    var highestID = localParticipantID;
    for (var i=0; i<enabledParticipants.length; i++) {
      var participant = enabledParticipants[i];
      //console.log(participant);
      if (participant.person.id < lowestID) {
        lowestID = participant.person.id;
      } else if (participant.person.id > highestID) {
        highestID = participant.person.id;
      }
    }
    // Participant is a turn reporter if they are EITHER the lowest and highest ID. They are the live attendance reporter ONLY IF they are the lowest ID.
    if (lowestID == localParticipantID)  {
      isTurnReporter = true;
    } else if (highestID == localParticipantID) {
      isTurnReporter = true;
    } else {
      isTurnReporter = false;
    }
    return true;
  };

  //TURN TAKING TRACKING CONTROLS:
  function reportTurnTakingEvent(participantID) {
      var hangout_group_id = appData.group.group_id;
      var reporter_google_id = gapi.hangout.getLocalParticipant().person.id;
      if (hangout_group_id && reporter_google_id && participantID) {
        console.log(hangout_group_id + " " + reporter_google_id + " " + participantID);
        // This is where we should send the info back and forth to firebase
      } 
  };

  function addParticipantsToGraph(addedParticipants) {
    // LOGIC FOR ADDING NEW PARTICIPANTS TO THE GRAPH GOES HERE
    console.log("adding a participant to the graph");
  };

  function removeParticipantsFromGraph(removedParticipants) {
    // LOGIC FOR REMOVING DEPARTED PARTICIPANTS TO THE GRAPH GOES HERE
    console.log("removing a participant from the graph");
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

  //LAYOUT AND VIDEO FEED CONTROLS:
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