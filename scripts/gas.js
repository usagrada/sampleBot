// const request = require('request');
const fetch = require('node-fetch');
const luxon = require('luxon');
const DateTime = luxon.DateTime
luxon.Settings.defaultZoneName = "Asia/Tokyo";
require('dotenv').config()

const url = process.env.url
const attachments = [
  {
    color: "#e6e6fa",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "どの本についての情報が知りたいですか？"
        },
        accessory: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "Select a book",
            emoji: true
          },
          options: [],
          action_id: "static_select-action"
        }
      }
    ]
  }
]

app.message(/^book/i, async ({ message, say }) => {
  const data = await (await fetch(url)).json();
  const d = data["data"]["book"].toString();
  console.log(d);
  const books = data["data"]["book"];
  let attach = attachments
  attach[0].blocks[0].accessory.options = []
  const sample = {
    "text": {
      "type": "plain_text",
      "text": "*this is plain_text text*",
      "emoji": true
    },
    "value": "value-0"
  }
  for (let i = 0; i < books.length; i++) {
    const bookName = books[i][1];
    const select = {
      "text": {
        "type": "plain_text",
        "text": bookName,
        "emoji": true
      },
      "value": books[i][2] + "-" + String(i)
    }
    attach[0].blocks[0].accessory.options.push(select)
  }

  // attach[0].blocks[0].accessory.options.push(sample)
  attach[0].blocks[0].accessory.action_id = "book-select"


  await say({ attachments: attach });
});

app.action('book-select', async ({ body, ack, say }) => {
  const bookName = body.actions[0].selected_option.text.text;
  const bookState = body.actions[0].selected_option.value.split('-')[0]
  // Acknowledge the action
  await ack({
    "attachments": [
      {
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "plain_text",
              "text": "This is a plain text section block.",
              "emoji": true
            }
          }
        ]
      }
    ]
  });

  const reply = [{
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `${bookName}の状態をどうしますか？\n現在: ${bookState}`
        }
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "積読"
            },
            "value": `${bookName}`,
            "action_id": "book-state-change-1"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "読書中",

            },
            "style": "danger",
            "value": `${bookName}`,
            "action_id": "book-state-change-2"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "読了"
            },
            "style": "primary",
            "value": `${bookName}`,
            "action_id": "book-state-change-3"
          }
        ]
      }
    ]
  }]
  await say({ attachments: reply });
});

app.action(/book-state-change-./, async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
  console.log("body::", body);
  const bookName = body.actions[0].value;
  const bookState = body.actions[0].text.text;

  // await say(`You selected ${bookName}`);
  // console.log("body\n", body);
  const obj = { command: "BookStateChange", name: bookName, state: bookState };
  const method = "POST";
  const data = JSON.stringify(obj);
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  try {
    console.log("fetchします");
    const res = await (await fetch(url, { method: method, mode: 'cors', headers: headers, body: data, redirect: 'follow' })).json();
    console.log(res);
    await say(`${bookName}の状態を${bookState}に変更しました`);
  }
  catch (error) {
    await say(`${bookName}の状態を変更できませんでした`);
    console.error(error);
  }

});

app.message(/^new book/i, async ({ message, say }) => {
  console.log(message);
  console.log(message.text)
  const newBook = message.text.split(" ").slice(2).join(" ");
  const today = DateTime.local().toFormat('yyyy/MM/dd');
  if(message.text.split(" ").length < 3){
    await say("本の名前を入力してください")
    return
  }

  const obj = { command: "newBook", name: newBook, day: today };
  const method = "POST";
  const data = JSON.stringify(obj);
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  try {
    console.log("fetchします");
    const res = await (await fetch(url, { method: method, mode: 'cors', headers: headers, body: data, redirect: 'follow' })).json();
    console.log(res);
    await say(`『${newBook}』を追加しました。`);
  }
  catch (error) {
    await say(`『${newBook}』の追加に失敗しました。`);
    console.error(error);
  }
})

app.message(/^新しい本|newbook/i, async ({ message, say }) => {
  console.log(message);
  console.log(message.text)
  const newBook = message.text.split(" ").slice(1).join(" ");
  const today = DateTime.local().toFormat('yyyy/MM/dd');
  if(message.text.split(" ").length < 2){
    await say("本の名前を入力してください")
    return
  }

  const obj = { command: "newBook", name: newBook, day: today };
  const method = "POST";
  const data = JSON.stringify(obj);
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  try {
    console.log("fetchします");
    const res = await (await fetch(url, { method: method, mode: 'cors', headers: headers, body: data, redirect: 'follow' })).json();
    console.log(res);
    await say(`『${newBook}』を追加しました。`);
  }
  catch (error) {
    await say(`『${newBook}』の追加に失敗しました。`);
    console.error(error);
  }
})

app.message(/おすすめの本/i, async ({ message, say }) => {
  const data = await (await fetch(url)).json();
  const d = data["data"]["book"].toString();
  console.log(d);
  const books = data["data"]["book"];
  let random = Math.floor(Math.random() * books.length);
  let recommend = books[random][1]
  // while (true) {
  //   if (books[random][2] === "積読") {
  //     recommend = books[random][1]
  //     break
  //   }
  //   else {
  //     random += 1
  //     if (random == books.length)
  //       random = 0
  //   }
  // }
  await say(`『${recommend}』はいかがでしょうか？`)

})

