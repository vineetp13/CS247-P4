//FIREBASE VARIABLES

var gaugeChart;
var graphChart;

//fb instance variable and conversation variable for ease of access
var fb_instance;
var fb_conversation;

//Indicator variable to keep track of whether timer has been started on any instance
var timer;

var fb_timer;

//User fb objects
var first_user;
var second_user;
var third_user;
var fourth_user;

//Snapshots for each user. Updated after change on firebase end
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

//Total amount of talking done by all parties (total talk is set to 5 minute inverval in ms)
var total_talk = 300000;

var username;


//TURN VARIABLES
var CANVAS_WIDTH;
var CANVAS_HEIGHT = 450;
var MIN_WIDTH = 300;

var isTurnReporter = false;
var lastReportedTurnID = null;


//FIREBASE STARTS HERE

$(document).ready(function(){
  connect_to_timer_firebase();
  //setupGauge();
  setupGraph();
  setupButtons();
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
  setInterval(function(){
    
    switch (increment_index){
      case 0: //NO SPEAKER
        break;
      case 1:
        first_user.set(first_snapshot_val + 99 < 300000 ? first_snapshot_val + 99 : 300000);
        second_user.set(second_snapshot_val - 33 > 0 ? second_snapshot_val - 33 : 0);
        third_user.set(third_snapshot_val - 33 > 0 ? third_snapshot_val - 33 : 0);
        fourth_user.set(fourth_snapshot_val - 33 > 0 ? fourth_snapshot_val - 33 : 0);
        break;
      case 2:
        second_user.set(second_snapshot_val + 99 < 300000 ? second_snapshot_val + 99 : 300000);
        first_user.set(first_snapshot_val - 33 > 0 ? first_snapshot_val - 33 : 0);
        third_user.set(third_snapshot_val - 33 > 0 ? third_snapshot_val - 33 : 0);
        fourth_user.set(fourth_snapshot_val - 33 > 0 ? fourth_snapshot_val - 33 : 0);
        break;
      case 3:
        third_user.set(third_snapshot_val + 99 < 300000 ? third_snapshot_val + 99 : 300000);
        first_user.set(first_snapshot_val - 33 > 0 ? first_snapshot_val - 33 : 0);
        second_user.set(second_snapshot_val - 33 > 0 ? second_snapshot_val - 33 : 0);
        fourth_user.set(fourth_snapshot_val - 33 > 0 ? fourth_snapshot_val - 33 : 0);
        break;
      case 4:
        fourth_user.set(fourth_snapshot_val + 99 < 300000 ? fourth_snapshot_val + 99 : 300000);
        first_user.set(first_snapshot_val - 33 > 0 ? first_snapshot_val - 33 : 0);
        second_user.set(second_snapshot_val - 33 > 0 ? second_snapshot_val - 33 : 0);
        third_user.set(third_snapshot_val - 33 > 0 ? third_snapshot_val - 33 : 0);
        break;
      default:
        break;
    }

  }, 100);
  
  //Push update event for visualization every 3 seconds to reflect changes
  setInterval(function(){
    fb_update_vis.push('update');
  }, 3000);

}

function connect_to_timer_firebase(){

  //Create new fb instance
  fb_instance = new Firebase("https://cs247-milestone3.firebaseio.com");

  //Establish link so that all instances recieve changes in increment index
  fb_increment_index = fb_instance.child("increment_index");
  fb_increment_index.on('value', function(dataSnapshot) {
    increment_index = dataSnapshot.val();
  });

  //Keep track for every instance of whether timer has been started
  fb_timer = fb_instance.child("timer");
  fb_timer.on('value', function(dataSnapshot) {
    timer = dataSnapshot.val();
  });

  //Keep track of new users
  fb_user_index = fb_instance.child("user_index");
  fb_user_index.on('value', function(dataSnapshot) {
    user_index = dataSnapshot.val() + 1;
  });



  //mechanism to receive vis. updates pushed to fb
  fb_update_vis = fb_instance.child("update");
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
  });

  fb_conversation = fb_instance.child('conversation');

  //Link local user percentages to fb objects/updates  
  first_user = fb_conversation.child('1');
  first_user.on('value', function(dataSnapshot) {
    first_snapshot_val = dataSnapshot.val();
  });
  first_user.set(initial_contribution);

  second_user = fb_conversation.child('2');
  second_user.on('value', function(dataSnapshot) {
    second_snapshot_val = dataSnapshot.val();
  });
  second_user.set(initial_contribution);

  third_user = fb_conversation.child('3');
  third_user.on('value', function(dataSnapshot) {
    third_snapshot_val = dataSnapshot.val();
  });
  third_user.set(initial_contribution);

  fourth_user = fb_conversation.child('4');
  fourth_user.on('value', function(dataSnapshot) {
    fourth_snapshot_val = dataSnapshot.val();
  });
  fourth_user.set(initial_contribution);

  //User designation code
  /*if(!user_index){
    fb_user_index.set(1);
    user_designation = 1;
  }else{
    user_designation = user_index;
    fb_user_index.set(user_index + 1);
  }*/

}

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

function setupGraph() {
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
          to: 20
        },
        {
          color: '#55BF3B',
          from: 20,
          to: 40
        },
        {
          color: '#DF5353',
          from: 40,
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
        name: 'Katie',
        data: [25]

    }, {
        name: 'Andrew',
        data: [25]
    }, {
        name: 'Julia',
        data: [25]

    }, {
        name: 'Will',
        data: [25]

    }]
  });
}

function setupButtons() {
  document.body.onkeydown = function(event) {
    event = event || window.event;
    var keycode = event.charCode || event.keyCode;
    switch (keycode) {
      case 49: // '1'
        fb_increment_index.set(1);
        break;
      case 50: // '2'
        fb_increment_index.set(2);
        break;
      case 51: // '3'
        fb_increment_index.set(3);
        break;
      case 52: // '4'
        fb_increment_index.set(4);
        break;
      default:
        fb_increment_index.set(0);
        break;
    }
    graphChart.series
  }
  if(timer != null){
    if(timer != 1){
      //start_timer();
    }else{
      console.log("Timer has already been started");
    }
  }else{
    //start_timer();
  }
}


//TURN-TAKING STARTS HERE

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
          if (eventObj.participants.length == 4) {
            // $('#start_discussion_btn').toggleClass("disabled");
            // $('#start_discussion_btn').click(function() {
            //   startDiscussion();
            // });
            // $('#end_discussion_btn').click(function() {
            //   endDiscussion();
            // });
          }
        }
      );

      gapi.hangout.data.onStateChanged.add(
        function(eventObj) {
          console.log("what is event obj");
          console.log(eventObj);
          console.log(eventObj.state.discussing);
          console.log("PLEEEEASE: " + $(eventObj.state).data("discussing"));
        }
      );

      getFBHangout();
    }
  );
};

function getFBHangout(){
  var hangout_group_id = gapi.hangout.getHangoutId();
  var reporter_google_id = gapi.hangout.getLocalParticipant().person.id;
  console.log(hangout_group_id + " " + reporter_google_id);
  fb_conversation = fb_instance.child(hangout_group_id);
}

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
    var hangout_group_id = gapi.hangout.getHangoutId();
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

function startDiscussion() {
  $("#start_discussion_btn").hide();
  $("#end_discussion_btn").show();
  gapi.hangout.data.setValue("discussing","true");
};

function endDiscussion() {
  // $("#start_discussion_btn").show();
  $("#end_discussion_btn").hide();
  gapi.hangout.data.setValue("discussing","false");

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