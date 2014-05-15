//FIREBASE VARIABLES
var set_up_done = false;
var hangout_group_id;
var participantID;

//VARS
var THRESHOLD_HIGH = 30;
var THRESHOLD_LOW = 20;

var NUM_USERS = 2;

//MATH
var subtract;
var increment;
var divide_by;

var gaugeChart;
var graphChart;

//fb instance variable and conversation variable for ease of access
var fb_instance;
var fb_conversation;
var fb_conversations;
var fb_reset;

//Indicator variable to keep track of whether timer has been started on any instance
var timer;
var discussing = false;

var fb_timer;
var timer_id;
var timer_2_id;

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

//Keep track of new user index [1, 2, 3, 4]
var fb_user_index;

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



//FIREBASE STARTS HERE

$(document).ready(function(){
  //connect_to_timer_firebase();
  //setupGauge();
  //setupGraph();
  //setupButtons();
});

function percentage_talk(time) {
  return Math.ceil((time/300000)*100);
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
        first_user ? first_user.child('contribution').set(first_snapshot_val + increment < 300000 ? first_snapshot_val + increment : 300000) : null;
        second_user ? second_user.child('contribution').set(second_snapshot_val - decrement > 0 ? second_snapshot_val - decrement : 0) : null;
        third_user ? third_user.child('contribution').set(third_snapshot_val - decrement > 0 ? third_snapshot_val - decrement : 0) : null;
        fourth_user ? fourth_user.set(fourth_snapshot_val - decrement > 0 ? fourth_snapshot_val - decrement : 0) : null;
        break;
      case 1:
        second_user ? second_user.child('contribution').set(second_snapshot_val + increment < 300000 ? second_snapshot_val + increment : 300000) : null;
        first_user ? first_user.child('contribution').set(first_snapshot_val - decrement > 0 ? first_snapshot_val - decrement : 0) : null;
        third_user ? third_user.child('contribution').set(third_snapshot_val - decrement > 0 ? third_snapshot_val - decrement : 0) : null;
        fourth_user ? fourth_user.set(fourth_snapshot_val - decrement > 0 ? fourth_snapshot_val - decrement : 0) : null;
        break;
      case 2:
        third_user ? third_user.child('contribution').set(third_snapshot_val + increment < 300000 ? third_snapshot_val + increment : 300000) : null;
        first_user ? first_user.child('contribution').set(first_snapshot_val - decrement > 0 ? first_snapshot_val - decrement : 0) : null;
        second_user ? second_user.child('contribution').set(second_snapshot_val - decrement > 0 ? second_snapshot_val - decrement : 0) : null;
        fourth_user ? fourth_user.set(fourth_snapshot_val - decrement > 0 ? fourth_snapshot_val - decrement : 0) : null;
        break;
      case 3:
        fourth_user ? fourth_user.set(fourth_snapshot_val + increment < 300000 ? fourth_snapshot_val + increment : 300000) : null;
        first_user ? first_user.child('contribution').set(first_snapshot_val - decrement > 0 ? first_snapshot_val - decrement : 0) : null;
        second_user ? second_user.child('contribution').set(second_snapshot_val - decrement > 0 ? second_snapshot_val - decrement : 0) : null;
        third_user ? third_user.child('contribution').set(third_snapshot_val - decrement > 0 ? third_snapshot_val - decrement : 0) : null;
        break;
      default:
        break;
    }

  }, 100);
  
  //Push update event for visualization every 3 seconds to reflect changes
  timer_2_id = setInterval(function(){
    fb_update_vis.push('update');
  }, 3000);

}

function connect_to_timer_firebase(){

  //Create new fb instance
  //fb_instance = new Firebase("https://cs247-milestone3.firebaseio.com");

  //Establish link so that all instances recieve changes in increment index
  /*fb_increment_index = fb_instance.child('increment_index');
  fb_increment_index.on('value', function(dataSnapshot) {
    increment_index = dataSnapshot.val();
  });

  //Keep track for every instance of whether timer has been started
  fb_timer = fb_instance.child('timer');
  fb_timer.on('value', function(dataSnapshot) {
    timer = dataSnapshot.val();
  });

  //Keep track of new users
  fb_user_index = fb_instance.child('user_index');
  fb_user_index.on('value', function(dataSnapshot) {
    user_index = dataSnapshot.val() + 1;
  });



  //mechanism to receive vis. updates pushed to fb
  fb_update_vis = fb_instance.child('update');
  fb_update_vis.on('child_added', function(dataSnapshot) {
    var percentage_1 = percentage_talk(first_snapshot_val);
    var percentage_2 = percentage_talk(second_snapshot_val);
    var percentage_3 = percentage_talk(third_snapshot_val);
    var percentage_4 = percentage_talk(fourth_snapshot_val);

    //Update user 1 percentage
    var data = graphChart.series[0].data;
    data[0].y = percentage_1;
    graphChart.series[0].setData(data,true);

    //... user 2 percentage
    var data = graphChart.series[1].data;
    data[0].y = percentage_2;
    graphChart.series[1].setData(data,true);

    //... user 3 percentage
    var data = graphChart.series[2].data;
    data[0].y = percentage_3;
    graphChart.series[2].setData(data,true);

    //... user 4 percentage
    var data = graphChart.series[3].data;
    data[0].y = percentage_4;
    graphChart.series[3].setData(data,true);

    //console.log(percentage_1);
    //console.log(percentage_2);
    //console.log(percentage_3);
    //console.log(percentage_4);
  });*/

  //User designation code
  /*if(!user_index){
    fb_user_index.set(1);
    user_designation = 1;
  }else{
    user_designation = user_index;
    fb_user_index.set(user_index + 1);
  }*/

}

/* We do not need this for now 
 * 
function setupGauge() {
  gaugeChart = new Highcharts.Chart({
    chart: {
        renderTo: 'gauge_container',
        type: 'gauge',
        plotBackgroundColor: null,
        plotBackgroundImage: null,
        plotBorderWidth: 0,
        plotShadow: false
    },    
    title: {
      text: 'Your Speaking'
    },    
    tooltip: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    pane: {
        startAngle: -90,
        endAngle: 90,
        background: [{
            backgroundColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                    [0, '#FFF'],
                    [1, '#333']
                ]
            },
            borderWidth: 0,
            outerRadius: '109%'
        }, {
            backgroundColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                    [0, '#333'],
                    [1, '#FFF']
                ]
            },
            borderWidth: 1,
            outerRadius: '107%'
        }, {
            // default background
        }, {
            backgroundColor: '#DDD',
            borderWidth: 0,
            outerRadius: '105%',
            innerRadius: '103%'
        }]
    },      
    // the value axis
    yAxis: {
        min: 0,
        max: 60,
        
        minorTickInterval: 5,
        minorTickWidth: 1,
        minorTickLength: 10,
        minorTickPosition: 'inside',
        minorTickColor: '#666',

        tickPixelInterval: 30,
        tickWidth: 2,
        tickPosition: 'inside',
        tickLength: 10,
        tickColor: '#666',
        labels: {
            step: 2,
            rotation: 'auto'
        },
        title: {
            text: '% talking'
        },
        plotBands: [{
            from: 0,
            to: 20,
            color: '#DDDF0D' // yellow
        }, {
            from: 20,
            to: 40,
            color: '#55BF3B' // green
        }, {
            from: 40,
            to: 60,
            color: '#DF5353' // red
        }]        
    },
    series: [{
        name: 'Talking',
        data: [0]
    }]
  });
}

*
*/

function setupGraph(names) {
  graphChart = new Highcharts.Chart({
    chart: {
      renderTo: 'graph_container',
      type: 'column'
    },
    title: {
      text: 'Average Talk Time'
    },
    subtitle: {
      text: 'As a percentage of the conversation'
    },
    xAxis: {
      labels: {
        enabled: false
      }
    },
    yAxis: {
      min: 0,
      max: 60,
      title: {
        text: '% Talking'
      },
      plotBands: [
        {
          color: '#DDDF0D',
          from: 0,
          to: THRESHOLD_LOW
        },
        {
          color: '#55BF3B',
          from: THRESHOLD_LOW,
          to: THRESHOLD_HIGH
        },
        {
          color: '#DF5353',
          from: THRESHOLD_HIGH,
          to: 60
        }
      ],
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
    series: [{
        name: names[0],
        data: [25]

    }, {
        name: names[1],
        data: [25]
    }, {
        name: names[2],
        data: [25]

    }, {
        name: names[3],
        data: [25]

    }]
  });
}

// function setupButtons() {
//   document.body.onkeydown = function(event) {
//     event = event || window.event;
//     var keycode = event.charCode || event.keyCode;
//     switch (keycode) {
//       case 49: // '1'
//         fb_increment_index.set(1);
//         break;
//       case 50: // '2'
//         fb_increment_index.set(2);
//         break;
//       case 51: // '3'
//         fb_increment_index.set(3);
//         break;
//       case 52: // '4'
//         fb_increment_index.set(4);
//         break;
//       default:
//         fb_increment_index.set(0);
//         break;
//     }
//     graphChart.series
//   }
//   if(timer != null){
//     if(timer != 1){
//       //start_timer();
//     }else{
//       console.log("Timer has already been started");
//     }
//   }else{
//     //start_timer();
//   }
// }


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
          if (eventObj.participants.length == 2) { // change this back to 4?
            // MAKE SURE TO UN_COMMENT THIS!!
            $('#start_graph_btn').toggleClass("disabled");
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

  if((reporter_google_id + "") != "111880716844037207882") {
    fb_conversation.child(reporter_google_id).child('name').set(gapi.hangout.getLocalParticipant().person.displayName.split(" ")[0]);
  }

  //Establish link so that all instances recieve changes in increment index
  fb_increment_index = fb_conversation.child('increment_index');
  fb_increment_index.on('value', function(dataSnapshot) {
    increment_index = dataSnapshot.val();
    current_participant = increment_index;
  }, null, this);

  //Keep track for every instance of whether timer has been started
  fb_timer = fb_conversation.child('timer');
  fb_timer.on('value', function(dataSnapshot) {
    timer = dataSnapshot.val();
  }, null, this);

  //Keep track of new users
  fb_user_index = fb_conversation.child('user_index');
  fb_user_index.on('value', function(dataSnapshot) {
    user_index = dataSnapshot.val() + 1;
  }, null, this);



  //mechanism to receive vis. updates pushed to fb
  fb_update_vis = fb_conversation.child('update');
  fb_update_vis.on('child_added', function(dataSnapshot) {
    var percentage_1 = (NUM_USERS >= 1) ? percentage_talk(first_snapshot_val) : 0;
    var percentage_2 = (NUM_USERS >= 2) ? percentage_talk(second_snapshot_val) : 0;
    var percentage_3 = (NUM_USERS >= 3) ? percentage_talk(third_snapshot_val) : 0;
    var percentage_4 = (NUM_USERS >= 4) ? percentage_talk(fourth_snapshot_val) : 0;

    var percentages = [percentage_1, percentage_3, percentage_2, percentage_4];

  
    for (var i = 0; i < NUM_USERS; i++) {

      // update percentages for user on graphh
      var data = graphChart.series[i].data;
      data[0].y = percentages[i];
      graphChart.series[i].setData(data,true);

      // check if above or below threshold to trigger alerts
      if (percentages[i] < THRESHOLD_LOW) { // too low
        console.log("Somebody has gone below " + THRESHOLD_LOW + "%.");
        if (participantIDs[i] == cur_userID) {
          console.log("That person is you. Sending notice...");
          dispNotice("Speak up! You should participate more.");
        } 
      }
      if (percentages[i] > THRESHOLD_HIGH) { // too high
        console.log("Somebody has gone above " + THRESHOLD_HIGH + "%.");
        if (participantIDs[i] == cur_userID) {
          console.log("That person is you. Sending notice...");
          dispNotice("Yo calm down brotha. You be talking too much.");
        }
      }

    }

    // //Update user 1 percentage
    // var data = graphChart.series[0].data;
    // data[0].y = percentage_1;
    // graphChart.series[0].setData(data,true);

    // //... user 2 percentage
    // var data = graphChart.series[1].data;
    // data[0].y = percentage_2;
    // graphChart.series[1].setData(data,true);

    // //... user 3 percentage
    // var data = graphChart.series[2].data;
    // data[0].y = percentage_3;
    // graphChart.series[2].setData(data,true);

    // //... user 4 percentage
    // var data = graphChart.series[3].data;
    // data[0].y = percentage_4;
    // graphChart.series[3].setData(data,true);

    //console.log(percentage_1);
    //console.log(percentage_2);
    //console.log(percentage_3);
    //console.log(percentage_4);

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
    decrement = Math.floor(100/NUM_USERS);
    increment = decrement*NUM_USERS;
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

    console.log("IDs: ");
    console.log(participantIDs);

    dataSnapshot.forEach(processUser);
    console.log("Users: ");
    console.log(users);
    console.log(names);
    console.log(snapshots);

    setupGraph(names);
    //setupButtons();
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
  var num_needed_participants = 4 - (num_participants);
  if (num_needed_participants <= 0) {
    document.getElementById("pending_participants").innerHTML = "You're all set for your discussion! Whenever everyone is ready, have someone click the \"Start Discussion\" button to initiate the discussion.";
  } else {
    document.getElementById("num_participants_needed").innerHTML = num_needed_participants;
  }
};