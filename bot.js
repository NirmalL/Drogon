var express = require('express');
var app = express();

var bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

const request = require('request');

app.use(express.static('public'));

app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});

app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Request will timeout in 20s and Fb will keep trying to resend
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var payload = message.quick_reply;
  var messageAttachments = message.attachments;

  if (!payload && messageText) {
    var msg = messageText.toLowerCase();
    
    if (msg.indexOf('generic')>=0) { sendGenericMessage(senderID); }
    
    else if (msg.indexOf('find')>=0) { sendQuickReplyForLocation(senderID); }

    else if (msg.indexOf('cars')>=0) { sendVehicleList(senderID); }

    else if (msg.indexOf('buttons')>=0) { sendButtonsList(senderID); }

    else if (msg.indexOf('booked')>=0) { sendBookedVehicle(senderID); }

    else if (msg.indexOf('Book now!'.toLowerCase())) {
      sendTextMessage(senderID, "Thank you! Please wait till we find you a ride...");
      setTimeout(function() {
        sendTextMessage(senderID, "Done! Here are the nearest rides");
        sendVehicleList(senderID);
      }, 4000);
    }

    else { sendTextMessage(senderID, messageText); }
    
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Set your destination");
    sendQuickReplyForLocation(senderID);
  } else {
    if (payload==='BOOK_NEW') {
      sendTextMessage(senderID, "Where should we pick you up?");
      sendQuickReplyForLocation(senderID);
    }
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  if (payload==='GET_STARTED') {
    sendQuickReplyForGetStarted(senderID);
  } else if (payload==='BOOK_NEW') {
    sendTextMessage(senderID, "Where should we pick you up?");
    sendQuickReplyForLocation(senderID);
  } else if (payload==='LOCATIONS_ARE_SET') {
    sendTextMessage(senderID, "Thank you! Please wait till we find you a ride...");
    setTimeout(function() {
      sendTextMessage(senderID, "Done! Here are the nearest rides");
      sendVehicleList(senderID);
    }, 4000);
  } else if (payload==='SELECTED_RIDE') {
    sendTextMessage(senderID, "Please wait while your ride is being booked...");
    setTimeout(function() {
      sendTextMessage(senderID, "Done! The ride's on its way. Here are the details");
      sendBookedVehicle(senderID);
    }, 4000);
  }
}

// SNIPPET
function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: "rift",
              subtitle: "Next-generation virtual reality",
              item_url: "https://www.oculus.com/en-us/rift/",               
              image_url: "http://loremflickr.com/300/180/movie,tv/all",
              buttons: [
                {
                  type: "web_url",
                  url: "https://www.oculus.com/en-us/rift/",
                  title: "Open Web URL"
                }, 
                {
                  type: "postback",
                  title: "Call Postback",
                  payload: "Payload for first bubble",
                }
              ]
            }, {
              title: "touch",
              subtitle: "Your Hands, Now in VR",
              item_url: "https://www.oculus.com/en-us/touch/",               
              image_url: "http://loremflickr.com/300/180/movie,tv/all",
              buttons: [{
                type: "web_url",
                url: "https://www.oculus.com/en-us/touch/",
                title: "Open Web URL"
              }, {
                type: "postback",
                title: "Call Postback",
                payload: "Payload for second bubble",
              }]
            }, {
              title: "rift",
              subtitle: "Next-generation virtual reality",
              item_url: "https://www.oculus.com/en-us/rift/",               
              image_url: "http://loremflickr.com/300/180/movie,tv/all",
              buttons: [{
                type: "web_url",
                url: "https://www.oculus.com/en-us/rift/",
                title: "Open Web URL"
              }, {
                type: "postback",
                title: "Call Postback",
                payload: "Payload for third bubble",
              }],
            }
          ]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function sendVehicleList(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: "Suzuki Alto",
              subtitle: "5 mins away, ~273 LKR",
              // item_url: "https://www.oculus.com/en-us/rift/",               
              image_url: "http://loremflickr.com/300/180/vehicle/all",
              buttons: [ 
                {
                  type: "postback",
                  title: "Book",
                  payload: "SELECTED_RIDE",
                }
              ]
            }, {
              title: "Nissan Leaf",
              subtitle: "7 mins away, ~320 LKR",
              // item_url: "https://www.oculus.com/en-us/touch/",               
              image_url: "http://loremflickr.com/300/180/vehicle/all",
              buttons: [ 
                {
                  type: "postback",
                  title: "Book",
                  payload: "SELECTED_RIDE",
                }
              ]
            }, {
              title: "Suzuki Swift",
              subtitle: "10 mins away, ~250 LKR",
              // item_url: "https://www.oculus.com/en-us/rift/",               
              image_url: "http://loremflickr.com/300/180/vehicle/all",
              buttons: [ 
                {
                  type: "postback",
                  title: "Book",
                  payload: "SELECTED_RIDE",
                }
              ]
            }
          ]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function sendBookedVehicle(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: "Harry Potter",
              subtitle: "Suzuki Alto, red, 5 mins away",
              // item_url: "https://www.oculus.com/en-us/rift/",               
              image_url: "http://loremflickr.com/300/180/man/all",
              buttons: [ 
                {
                  type:"phone_number",
                  title:"Call the driver",
                  payload:"+94000000000"
                },
                {
                  type: "postback",
                  title: "Book",
                  payload: "CANCEL_RIDE",
                }
              ]
            }
          ]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(error, response.statusCode);
    }
  });  
}

function sendQuickReplyForGetStarted(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      quick_replies:[
        {
          content_type: "text",
          title: "Book a ride",
          payload: "BOOK_NEW"
        },
        {
          content_type: "text",
          title: "Schedule a ride",
          payload: "SCHEDULE_NEW"
        },
        {
          content_type: "text",
          title: "Help me",
          payload: "HELP_PAGE"
        },
        {
          content_type: "text",
          title: "Call us",
          payload: "CALL_US"
        }
      ],
      text: "Welcome to Drogon! How can we help?"
    }
  };  

  callSendAPI(messageData);
}

function sendQuickReplyForLocation(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      quick_replies:[
        {
          content_type: "location"
        },
        {
          content_type: "text",
          title: "Book now!",
          payload: "LOCATIONS_ARE_SET"
        }
      ],
      text: "Select location"
    }
  };  

  callSendAPI(messageData);
}

// SNIPPET
function sendButtonsList(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
    attachment:{
      type:"template",
      payload:{
        template_type:"button",
        text:"What do you want to do next?",
        buttons:[
          {
            type:"web_url",
            url:"https://www.messenger.com",
            title:"Visit Messenger"
          },
          {
            type:"phone_number",
            title:"Call Representative",
            payload:"+94000000000"
          },
          {
            type:"postback",
            title:"Bookmark Item",
            payload:"BOOKMARK_ADD"
          }
        ]
      }
    }
  }
  };  

  callSendAPI(messageData);
}

var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
