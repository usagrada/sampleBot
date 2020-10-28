app.message(/command|help/, async ({ message, say }) => {
  // TODO
  // コマンド一覧を追加
  const command = ["command, help", "task day, taskday", "task week, taskweek", "book", "new book 追加したい本の名前", "newbook 追加したい本の名前", "新しい本 追加したい本の名前", "おすすめの本","おすすめのクイズ"]
  await say("私が使える返信は以下の通りです。\n" + command.toString())
})
// Listens to incoming messages that contain "hello"
app.message('hello', async ({ message, say }) => {
  console.log(message.blocks[0].elements[0].elements[0]);
  // say() sends a message to the channel where the event was triggered
  await say({
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Hey there <@${message.user}>!`
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Click Me"
          },
          "action_id": "button_click"
        }
      }
    ],
    text: `Hey there <@${message.user}>!`
  });
});


app.action('button_click', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
  await say(`<@${body.user.id}> clicked the button`);
});