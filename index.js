const { App } = require('@slack/bolt');
const axios = require('axios');
const express = require('express');

require('dotenv').config();

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.BOT_TOKEN,
  signingSecret: process.env.SECRET_SIGNING_KEY
});

// Create an Express app
const expressApp = express();

// Set up a default route to display a welcome message
expressApp.get('/', (req, res) => {
  res.send('Welcome to your Slack Bolt app!');
});

// Mount the Express app as a middleware to handle HTTP requests
app.receiver.app.use(expressApp);

// Start your app
(async () => {
  await app.start(process.env.PORT || 3003);
  console.log(`⚡️ Bolt app is running! ${process.env.PORT}`);
})();

// Define a function to handle button clicks and post messages
const handleButtonClick = async ( buttonText, body, client) => {
  
  let channelID = body.channel.id;
  let userNm = body.user.name;
  let sOrderNo = exgtractOD(body.message.text);

  console.log("user Name " + userNm + " " + "ChannelID: " + channelID + " Order No: " + sOrderNo);

  try {
    // Call the chat.postMessage method using the WebClient
    const result = await client.chat.postMessage({
      channel:  body.user.id,//channelID,
      //username: userNm,
      text: `The Order No: ${sOrderNo} is ${buttonText} by: ${userNm}`,
      blocks: [{
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "New Delivery Request\n OrderNo:"+ sOrderNo + "\n Delivery Type: " ,
          "emoji": true
        }
      }]
    });
  } catch (error) {
    console.error(error);
  }

  updateExcelRowDeliveryStatus(sOrderNo, buttonText, userNm);
};

// Use the function for the 'buttonYes' action
app.action('buttonYes', async ({ body,action, ack, client }) => {
  await ack(); // Acknowledge the button click
  await handleButtonClick( 'Accepted', body, client);
});

// You can use the same function for other buttons
app.action('buttonNo', async ({ body,action, ack, client }) => {
  await ack(); // Acknowledge the button click
  await handleButtonClick( 'Rejected', body, client);
});

// Add more button actions as needed
app.action('buttonComplete', async ({ body,action, ack, client }) => {
  await ack(); // Acknowledge the button click
  await handleButtonClick( 'Completed', body, client);
});
app.action('buttonCancel', async ({ body,action, ack, client }) => {
  await ack(); // Acknowledge the button click
  await handleButtonClick( 'Cancelled', body, client);
});



//---
// // app.action(
// //   /*{	action_id: 'buttonYes',
// // block_id: 'actions'}*/ 'buttonNo'
// //   , async ({ body, action, ack, client }) => {
// // await ack();

// // // Do something in response
// // //publishMessage(action.conv, "Hello world :tada:");

// //  let channelID = body.channel.name;
// // let userNm = body.user.name;

// // let sOrderNo = exgtractOD( body.message.text);

// // console.log ("user Name " +userNm +" " +"ChannelID: "+ channelID + " Order No: "+ sOrderNo );
// // try {
// //   // Call the chat.postMessage method using the WebClient
// //   const result = await client.chat.postMessage({
// //     channel: channelID,
// //     text: "The Order No: " + sOrderNo +" is Rejected by: " + userNm
// //   });

// //  // console.log(result);
// // }
// // catch (error) {
// //   console.error(error);
// // } 
 
// // //console.log("sss: " +client.say("hi no clicked"));
// // updateExcelRowDeliveryStatus(sOrderNo,"no",userNm);

// // });

// // This listener will only be called when the `action_id` matches 'select_user' AND the `block_id` matches 'assign_ticket'
// // app.action(
// //     /*{	action_id: 'buttonYes',
// // 	block_id: 'actions'}*/ 'buttonYes'
// //     , async ({ body, action, ack, client }) => {
// // 	await ack();
// // 	// Do something in response
// //   // console.log('a button Yes has been clicked body is : ' + body.message);
// //    let channelID = body.channel.id;
// //   let userNm = body.user.name;
  
// //   let sOrderNo = exgtractOD( body.message.text);

// //   console.log ("user Name " +userNm +" " +"ChannelID: "+ channelID + " Order No: "+ sOrderNo );
// //   //publishMessage(channelID,"OK we got this");
// //   // ID of the channel you want to send the message to
 
// // try {
// //   // Call the chat.postMessage method using the WebClient
// //   const result = await client.chat.postMessage({
// //     channel: channelID,
// //     text: "The Order No: " + sOrderNo +" is Accepted by: " + userNm
// //   });

// //  // console.log(result);
// // }
// // catch (error) {
// //   console.error(error);
// // }
// //   updateExcelRowDeliveryStatus(sOrderNo,"yes",userNm);

// // });

// // This will match any message that contains 👋
// app.message('hii', async ({ message, say }) => {
//   // Handle only newly posted messages here
//   if (message.subtype === undefined
//     || message.subtype === 'bot_message'
//     || message.subtype === 'file_share'
//     || message.subtype === 'thread_broadcast') {
//     await say(`Hello, <@${message.user}>`);
//   }
// });

//write a function to retrive the order from this json file 

function exgtractOD(text) {

  let strval = text.substring(text.indexOf("OrderNo:")+8,text.indexOf("Delivery Type")).trim();
  
  return strval;
}

//write a function to update the excelsheet with the given columnName and column value
async function updateExcelRowDeliveryStatus(orderNo, deliveryStatus, deliveryDriver) {
  const url = `https://sheetdb.io/api/v1/3wej86c3msbui/OrderNo/${orderNo}`;

  try {
      const response = await axios.patch(url, {
          data: {
              'OrderAccepted': deliveryStatus,
              'DriverName': deliveryDriver
          }
      }, {
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
          }
      });

     // console.log(response.data);
     updateExcelOrderStatus(orderNo, deliveryStatus,deliveryDriver);
  } catch (error) {
      console.error('Error:', error.message);
  }
}

//todo to call the below function in the orderupdate funciton 
async function updateExcelOrderStatus(orderNo, deliveryStatus, deliveryDriver) 
{ 
  // Get the current time in the desired format
  const currentTime = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
});
axios.post('https://sheetdb.io/api/v1/3wej86c3msbui?sheet=OrderStatus', {
    data: [
        {
            'TrnID': "INCREMENT",
            'OrderNo': orderNo,
            'Status': deliveryStatus,
            'Driver': deliveryDriver,
            'Time': currentTime
        }
    ]
}, {
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
})
    .then((response) => console.log(response.data))
    .catch((error) => console.error(error));
}