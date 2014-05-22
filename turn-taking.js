//FIREBASE VARIABLES
var set_up_done = false;
var hangout_group_id;
var participantID;

//VARS
var NUM_USERS = 2;
var VIZ_REFRESH_INTERVAL_MS = 7000;
var TIMER_UPDATE_INTERVAL = 1000;
var THRESHOLD_LOW;
var THRESHOLD_HIGH;

//SETTINGS
// var INSTRUCTOR_ID = "111880716844037207882"; // Julia Cambre
var INSTRUCTOR_ID = '112817507031505914726'; // WC

//MATH
var subtract;
var increment;
var divide_by;

var graphChart;

//fb instance variable and conversation variable for ease of access
var fb_instance;
var fb_conversation;
var fb_conversations;
var fb_reset;
var fb_moderator_message;

//Indicator variable to keep track of whether timer has been started on any instance
var timer;
var discussing = false;
var notification_OK = true;

var fb_timer;
var timer_id;
var timer_2_id;

var alertedOver = {};
var alertedUnder = {};

//User fb objects
var users;
var local_user;
var first_user;
var second_user;
var third_user;
var fourth_user;

//Snapshots for each user. Updated after change on firebase end
var snapshots;
var first_snapshot_val;
var second_snapshot_val;
var third_snapshot_val;
var fourth_snapshot_val;

//listen for update events
var fb_update_vis;

//Keep track of current speaker [1, 2, 3, 4]
var increment_index;

var fb_increment_index;

var user_index;

var user_designation;

//Seed contribution in seconds to balance statistics (.25 of 5 minutes each in ms)
var initial_contribution = 75000;
var local_user_contribution;

//Total amount of talking done by all parties (total talk is set to 5 minute inverval in ms)
var total_talk = 300000;

var username;
var names;
var current_participant;
var cur_userID;
var participantIDs;



//TURN VARIABLES
var CANVAS_WIDTH;
var CANVAS_HEIGHT = 450;
var MIN_WIDTH = 300;

var isTurnReporter = false;
var lastReportedTurnID = null;

function percentage_talk(time) {
  return Math.floor((time/total_talk)*100);
}


//Second Timer to increment number of seconds talked per person
//And decrement participation of non-speakers
function start_timer(){
  console.log("Starts timer");

  fb_increment_index.set(0); //Initialize index to 0

  //Indicate that the timer has been started by an instance
  fb_timer.set(1);

  //Adds time to the user currently talking and removes and equal amount of time from the users not talking
  //Maintains a constant 5 minute window to calculate talking percentages
  timer_id = setInterval(function(){
    
    switch (increment_index){
      case -1: //NO SPEAKER
        break;
      case 0:
        first_user ? first_user.child('contribution').set(first_snapshot_val + increment < total_talk ? first_snapshot_val + increment : total_talk) : null;
        second_user ? second_user.child('contribution').set(second_snapshot_val - decrement > 0 ? second_snapshot_val - decrement : 0) : null;
        third_user ? third_user.child('contribution').set(third_snapshot_val - decrement > 0 ? third_snapshot_val - decrement : 0) : null;
        fourth_user ? fourth_user.child('contribution').set(fourth_snapshot_val - decrement > 0 ? fourth_snapshot_val - decrement : 0) : null;
        break;
      case 1:
        second_user ? second_user.child('contribution').set(second_snapshot_val + increment < total_talk ? second_snapshot_val + increment : total_talk) : null;
        first_user ? first_user.child('contribution').set(first_snapshot_val - decrement > 0 ? first_snapshot_val - decrement : 0) : null;
        third_user ? third_user.child('contribution').set(third_snapshot_val - decrement > 0 ? third_snapshot_val - decrement : 0) : null;
        fourth_user ? fourth_user.child('contribution').set(fourth_snapshot_val - decrement > 0 ? fourth_snapshot_val - decrement : 0) : null;
        break;
      case 2:
        third_user ? third_user.child('contribution').set(third_snapshot_val + increment < total_talk ? third_snapshot_val + increment : total_talk) : null;
        first_user ? first_user.child('contribution').set(first_snapshot_val - decrement > 0 ? first_snapshot_val - decrement : 0) : null;
        second_user ? second_user.child('contribution').set(second_snapshot_val - decrement > 0 ? second_snapshot_val - decrement : 0) : null;
        fourth_user ? fourth_user.child('contribution').set(fourth_snapshot_val - decrement > 0 ? fourth_snapshot_val - decrement : 0) : null;
        break;
      case 3:
        fourth_user ? fourth_user.child('contribution').set(fourth_snapshot_val + increment < total_talk ? fourth_snapshot_val + increment : total_talk) : null;
        first_user ? first_user.child('contribution').set(first_snapshot_val - decrement > 0 ? first_snapshot_val - decrement : 0) : null;
        second_user ? second_user.child('contribution').set(second_snapshot_val - decrement > 0 ? second_snapshot_val - decrement : 0) : null;
        third_user ? third_user.child('contribution').set(third_snapshot_val - decrement > 0 ? third_snapshot_val - decrement : 0) : null;
        break;
      default:
        break;
    }

  }, TIMER_UPDATE_INTERVAL);
  
  //Push update event for visualization every 3 seconds to reflect changes
  timer_2_id = setInterval(function(){
    fb_update_vis.push('update');
  }, VIZ_REFRESH_INTERVAL_MS);

}

/* Usage: 
  buildBarGraph('graph_container', names_arr, {
    title_text: 'Average Talk Time',
    subtitle_text: 'As a percentage of the conversation',
    yAxis_max: 60,
    yAxis_title_text: '% Talking',
    yAxis_plotBands: [{color: '#DF5353', from: 0, to: THRESHOLD_LOW},
                      {color: '#55BF3B', from: THRESHOLD_LOW, to: THRESHOLD_HIGH},
                      {color: '#DF5353', from: THRESHOLD_HIGH, to: 60}]
  });
*/
function buildBarGraph(containerID, names, style) {

  if (typeof style == 'undefined') style = {};
  if (typeof containerID == 'undefined') return null;
  $(containerID).empty(); // to address leaks

  var series = [];
  if (typeof names !== 'undefined') {
    for (i in names) {
      series.push({
        name: names[i],
        data: [100 / names.length]
      });
    }
  }

  var graph = new Highcharts.Chart({
    chart: {
      renderTo: containerID,
      type: 'column'
    },
    title: {
      text: style.title_text || null
    },
    subtitle: {
      text: style.subtitle_text || null
    },
    xAxis: {
      labels: {
        enabled: false
      }
    },
    yAxis: {
      min: 0,
      max: style.yAxis_max || 100,
      tickInterval: style.yAxis_tickInterval || null,
      gridLineColor: 'transparent',
      title: {
        text: style.yAxis_title_text || null
      },
      plotBands: style.yAxis_plotBands || null
    },
    tooltip: {
      enabled: false
    },
    plotOptions: {
      column: {
      pointPadding: 0.2,
        borderWidth: 0
      }
    },
    series: series
  });

  return graph;
}

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

      //Determine whether the just-added local participant is a turn reporter (there are two per session)
      listenForTurnReporting();

      //Listen for future changes to enabled/disabled participants to see if local participant becomes turn reporter
      gapi.hangout.onEnabledParticipantsChanged.add(
        function(eventObj) {
          listenForTurnReporting();
        }
      );

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

      gapi.hangout.onParticipantsChanged.add(
        function(eventObj) {
          if (eventObj.participants.length == NUM_USERS) { // change this back to 4?
            // MAKE SURE TO UN_COMMENT THIS!!
            $('#start_graph_btn').on('click', function() {
              startGraphing();
            });
            $('#end_discussion_btn').on('click', function() {
              endGraphing();
            });
          }
          setNumParticipantsNeeded();
        }
      );

      // Update the display for the *other* participants in response to one person clicking the start/stop 
      gapi.hangout.data.onStateChanged.add(
        function(eventObj) {
          if (eventObj.state.phase == "share") {
            $("#start_graph_btn").show();
          } else if (eventObj.state.phase == "think") {
            $("#start_graph_btn").hide();
            $("#restart_graph_btn").hide();
          } else if (eventObj.state.graphing == "true") {
            $("#restart_graph_btn").show();
          } else if (eventObj.state.graphing == "false") {
            $("#restart_graph_btn").hide();
            discussing = false;
            if(timer_id){
              clearInterval(timer_id);
              timer_id = null;
            }
            if(timer_2_id){
              clearInterval(timer_2_id);
              timer_2_id = null;
            }
            first_user ? first_user.child('contribution').set(initial_contribution) : null;
            second_user ? second_user.child('contribution').set(initial_contribution) : null;
            third_user ? third_user.child('contribution').set(initial_contribution) : null;
            fourth_user ? fourth_user.child('contribution').set(initial_contribution) : null;

            $("#start_graph_btn").show();
          }
        }
      );
      //connect_to_timer_firebase();
      getFBHangout();
    }
  );
};

function dispNotice(msg) {
  gapi.hangout.layout.displayNotice(msg,true);
}

function getFBHangout(){
  hangout_group_id = gapi.hangout.getHangoutId();
  var reporter_google_id = gapi.hangout.getLocalParticipant().person.id;
  cur_userID = reporter_google_id;
  fb_instance = new Firebase("https://cs247-milestone3.firebaseio.com");
  fb_conversations = fb_instance.child('conversations');
  fb_conversation = fb_conversations.child(hangout_group_id);
  var self = this;

  fb_conversation.on('value', checkSetup, null, self);

  if((reporter_google_id + "") != INSTRUCTOR_ID) {
    fb_conversation.child(reporter_google_id).child('name').set(gapi.hangout.getLocalParticipant().person.displayName.split(" ")[0]);
  }

  //Establish link so that all instances recieve changes in increment index
  fb_increment_index = fb_conversation.child('increment_index');
  fb_increment_index.on('value', function(dataSnapshot) {
    increment_index = dataSnapshot.val();
    current_participant = increment_index;
  }, null, this);

  //Moderator Message
  fb_moderator_message = fb_conversation.child('moderator_message');
  fb_moderator_message.on('child_added', function(dataSnapshot) {
    console.log(dataSnapshot);
    console.log(dataSnapshot.child('user_id').val());
    if (dataSnapshot.child('user_id').val() == cur_userID) {
        console.log("Moderator is sending you a message...");
        dispNotice(dataSnapshot.child('message').val());
    } 
  }, null, this);

  //Keep track for every instance of whether timer has been started
  fb_timer = fb_conversation.child('timer');
  fb_timer.on('value', function(dataSnapshot) {
    timer = dataSnapshot.val();
  }, null, this);

  //mechanism to receive vis. updates pushed to fb
  fb_update_vis = fb_conversation.child('update');
  fb_update_vis.on('child_added', function(dataSnapshot) {
    var percentage_1 = (names.length >= 1) ? percentage_talk(first_snapshot_val) : 0;
    var percentage_2 = (names.length >= 2) ? percentage_talk(second_snapshot_val) : 0;
    var percentage_3 = (names.length >= 3) ? percentage_talk(third_snapshot_val) : 0;
    var percentage_4 = (names.length >= 4) ? percentage_talk(fourth_snapshot_val) : 0;

    var percentages = [percentage_1, percentage_2, percentage_3, percentage_4];
    console.log(percentages);

  
    for (var i = 0; i < names.length; i++) {

      // update percentages for user on graphh
      var data = graphChart.series[i].data;
      data[0].y = percentages[i];
      graphChart.series[i].setData(data,true);

      if(cur_userID == INSTRUCTOR_ID){
        if (percentages[i] < THRESHOLD_LOW) { // too low
          alertedOver[participantIDs[i]] = 0;
          if(alertedUnder[participantIDs[i]] == 0){
            alertedUnder[participantIDs[i]] = VIZ_REFRESH_INTERVAL_MS;
            console.log("Sending Message for less");
            fb_moderator_message.push({'user_id': participantIDs[i], 'message': 'Hangout Moderator System Notice: Speak up! You should participate more.'});
          }else if(alertedUnder[participantIDs[i]] > 15000){
            alertedUnder[participantIDs[i]] = 0;
          }else{
            alertedUnder[participantIDs[i]] = alertedUnder[participantIDs[i]] + VIZ_REFRESH_INTERVAL_MS;
          }
          //console.log("Somebody has gone below " + THRESHOLD_LOW + "%. His or her % is: " + percentages[i] + "%. This is user id: " + i + ".");
          //if (participantIDs[i] == cur_userID) {
            //console.log("That person is you. Sending notice...");
            //dispNotice("Speak up! You should participate more.");
          //} 
        }else if (percentages[i] > THRESHOLD_HIGH) { // too high
          alertedUnder[participantIDs[i]] = 0;
          if(alertedOver[participantIDs[i]] == 0){
            alertedOver[participantIDs[i]] = VIZ_REFRESH_INTERVAL_MS;
            console.log("Sending Message for more");
            fb_moderator_message.push({'user_id': participantIDs[i], 'message': 'Hangout Moderator System Notice:  Seems like you\'ve been talking quite a bit recently! Why not allow some other folks the chance to speak?'});
          }else if(alertedOver[participantIDs[i]] > 15000) {
            alertedOver[participantIDs[i]] = 0;
          }else{
            alertedOver[participantIDs[i]] = alertedOver[participantIDs[i]] + VIZ_REFRESH_INTERVAL_MS;
          }
          //console.log("Somebody has gone above " + THRESHOLD_HIGH + "%. His or her % is: " + percentages[i] + "%. This is user id: " + i + ".");
          //if (participantIDs[i] == cur_userID) {
            //console.log("That person is you. Sending notice...");
            //dispNotice("Hangout Moderator System Notice:  Seems like you've been talking quite a bit recently! Why not allow some other folks the chance to speak?");
          //}
        }else{
          alertedOver[participantIDs[i]] = 0;
          alertedUnder[participantIDs[i]] = 0;
        }
      }

      // check if above or below threshold to trigger alerts
      if (percentages[i] < THRESHOLD_LOW) { // too low
        console.log("Somebody has gone below " + THRESHOLD_LOW + "%. His or her % is: " + percentages[i] + "%. This is user id: " + i + ".");
        if (participantIDs[i] == cur_userID) {
          console.log("That person is you. Sending notice...");
          if (notification_OK) {
            dispNotice("Speak up! You should participate more.");
            notification_OK = false;
            setTimeout({
              notification_OK = true;
            }, 30000);
          }
        } 
      }
      if (percentages[i] > THRESHOLD_HIGH) { // too high
        console.log("Somebody has gone above " + THRESHOLD_HIGH + "%. His or her % is: " + percentages[i] + "%. This is user id: " + i + ".");
        if (participantIDs[i] == cur_userID) {
          console.log("That person is you. Sending notice...");
          if (notification_OK) {
            dispNotice("Hangout Moderator System Notice:  Seems like you've been talking quite a bit recently! Why not allow some other folks the chance to speak?");
            notification_OK = false;
            setTimeout({
              notification_OK = true;
            }, 30000);
          }
        }
      }

    }

  }, null, this);

}

function checkSetup(dataSnapshot){
  if(set_up_done){
    return;
  }else{
    
  }

  if(dataSnapshot.name() != hangout_group_id){
    console.log("NOT OUR CONVERSATION");
    return;
  }

  var num_children = dataSnapshot.numChildren();
  if (num_children == NUM_USERS) { // change back to 4
    decrement = Math.floor(TIMER_UPDATE_INTERVAL/(NUM_USERS - 1));
    increment = decrement*(NUM_USERS - 1);
    console.log("Increment Val: " + increment);
    console.log("Decrement Val: " + decrement);
    set_up_done = true;
    console.log(4 + " children now added!");
    names = [];
    users = [];
    snapshots = [];
    participantIDs = [];

    dataSnapshot.forEach( function(childSnapshot) {
      var id = childSnapshot.name();
      participantIDs.push(id);
    });

    if(cur_userID == INSTRUCTOR_ID){
      for(var i = 0; i < participantIDs.length; i++){
        alertedOver[participantIDs[i]] = 0;
        alertedUnder[participantIDs[i]] = 0;
      }
    }

    console.log("IDs: ");
    console.log(participantIDs);
    initial_contribution = Math.floor(total_talk/NUM_USERS);
    dataSnapshot.forEach(processUser);
    console.log("Users: ");
    console.log(users);
    console.log(names);
    console.log(snapshots);

    var YAXIS_MAX = Math.ceil((100 / names.length)/10) * 20;
    THRESHOLD_LOW = (100 / names.length) - ((100 / names.length) * .5);
    THRESHOLD_HIGH = (100 / names.length) + Math.floor((100 / names.length) * .5);
    graphChart = buildBarGraph('graph_container', names, {
        title_text: 'Average Talk Time',
        subtitle_text: 'As a percentage of the conversation',
        yAxis_max: YAXIS_MAX,
        yAxis_tickInterval: 10,
        yAxis_title_text: '% Talking',
        yAxis_plotBands: [{color: '#DF5353', from: 0, to: THRESHOLD_LOW},
                          {color: '#55BF3B', from: THRESHOLD_LOW, to: THRESHOLD_HIGH},
                          {color: '#DF5353', from: THRESHOLD_HIGH, to: YAXIS_MAX}]
      });
    //setupGraph(names);
  }
}

function processUser(childSnapshot){
  users.push(childSnapshot.name());

  var my_index = participantIDs.indexOf(childSnapshot.name());
  console.log("my_index: " + my_index);
  switch (my_index) {
    case 0:
      first_user = fb_conversation.child(childSnapshot.name());
      first_user.child('contribution').on('value', function(dataSnapshot) {
        first_snapshot_val = dataSnapshot.val();
      });
      first_user.child('contribution').set(initial_contribution);
      break;
    case 1:
      second_user = fb_conversation.child(childSnapshot.name());
      second_user.child('contribution').on('value', function(dataSnapshot) {
        second_snapshot_val = dataSnapshot.val();
      });
      second_user.child('contribution').set(initial_contribution);
      break;
    case 2:
      third_user = fb_conversation.child(childSnapshot.name());
      third_user.child('contribution').on('value', function(dataSnapshot) {
        third_snapshot_val = dataSnapshot.val();
      });
      third_user.child('contribution').set(initial_contribution);
      break;
    case 3:
      fourth_user = fb_conversation.child(childSnapshot.name());
      fourth_user.child('contribution').on('value', function(dataSnapshot) {
        fourth_snapshot_val = dataSnapshot.val();
      });
      fourth_user.child('contribution').set(initial_contribution);
      break;
    default:
      break;
  }

  var name = childSnapshot.child('name').val();
  names.push(name);
}


// NOTE: This function was derived from Julia Cambre's work on Talkabout 
function listenForTurnReporting() {
  determineReporters();
  if (isTurnReporter) {
    gapi.hangout.layout.getDefaultVideoFeed().onDisplayedParticipantChanged.add(
      function(eventObj) {
        trackTurns.call(this, eventObj);
      }
    );
  } else {
    lastReportedTurnID = null; //reset the last reported ID to null in preparation for the next time we're turn reporter
    gapi.hangout.layout.getDefaultVideoFeed().onDisplayedParticipantChanged.remove(
      function(eventObj) {
        trackTurns.call(this, eventObj);
      }
    );
  }
};

// NOTE: This function was derived from Julia Cambre's work on Talkabout 
function trackTurns(eventObj) {
  var participant = gapi.hangout.getParticipantById(eventObj.displayedParticipant);
  if(participant){
    participantID = participant.person.id;

    //Report data back to the server. Send displayed participant's NAME & ID, reporter's ID **for each reporter**
    reportTurnTakingEvent.call(this, participantID);
  }
};

// NOTE: This function was derived from Julia Cambre's work on Talkabout 
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

// NOTE: This function was derived from Julia Cambre's work on Talkabout 
//TURN TAKING TRACKING CONTROLS:
function reportTurnTakingEvent(participantID) {
  var index = participantIDs.indexOf(participantID);
  if(current_participant != index) {
    console.log("Change speaker to: " + participantID);
    fb_increment_index.set(index);
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

function startGraphing() {
  $("#start_graph_btn").hide();
  $("#end_discussion_btn").show();
  start_timer();
  gapi.hangout.data.setValue("graphing","true");
  $("#graph_buttons").show();
  $("#graph_container").show();
  $("#panel_container_wrapper").height(CANVAS_HEIGHT);

};

function endGraphing() {
  $("#start_graph_btn").show();
  $("#end_graph_btn").hide();
  gapi.hangout.data.setValue("graphing","false");

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
  var num_needed_participants = NUM_USERS - (num_participants);
  if (num_needed_participants <= 0) {
    document.getElementById("pending_participants").innerHTML = "You're all set for your discussion! Whenever everyone is ready, have someone click the \"Start Discussion\" button to initiate the discussion.";
  } else {
    document.getElementById("num_participants_needed").innerHTML = num_needed_participants;
  }
};