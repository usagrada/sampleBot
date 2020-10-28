const { WebClient } = require('@slack/client')
const luxon = require('luxon');
const DateTime = luxon.DateTime
require('dotenv').config()
const key = process.env.key
const trello_token = process.env.token
const boardId = process.env.boardId
const axios = require('axios');
luxon.Settings.defaultZoneName = "Asia/Tokyo";


const client = axios.create({
  baseURL: 'https://api.trello.com'
});

const path = `/1/boards/${boardId}/cards`;

const params = {
  params: {
    key: key,
    token: trello_token,
  }
}
// (1)アクセストークン（環境変数から取得）
const token = process.env.SLACK_BOT_TOKEN

// (2)WebClientインスタンスの生成
const web = new WebClient(token)

// (3)チャンネル名、またはIDの指定
const conversationId = 'trello-task'
// const conversationId = 'test'

// (4)chat.postMessageの実行
async function main() {
  const greeting = "おはようございます。\n"
  const message = "<!channel> \n" + greeting;
  const attach1 = await dayTask();
  const attach2 = await weekTask();
  const attachments = [...attach1, ...attach2];
  web.chat.postMessage({ channel: conversationId, text: message, as_user: true, attachments:attachments })
    .then((res) => {
      console.log('メッセージを送信しました: ', res.ts)
    })
    .catch(console.error)
}

main();

async function dayTask() {
  const res = await client.get(path, params)
  const now = new Date()
  const data = res.data
  const tasksTodaySubmit = []
  const tasksToday = []
  const tasksTomorrow = []
  const taskDueOver = []
  for (let i = 0; i < data.length; i++) {
    const card = data[i];
    if (card.due === null) { continue; }
    const taskDue = new Date(card.due)
    const elapsed = taskDue.getTime() - now.getTime()

    const dt = DateTime.fromISO(card.due).toLocal();
    // console.log(card.name, dt.toString())

    const tmp = DateTime.local().toSQLDate();
    const today = DateTime.fromISO(tmp);
    const tomorrow = today.plus({ day: 1 });
    const dayAfterTomorrow = today.plus({ day: 2 });
    const dayAfterDayAfterTomorrow = today.plus({ day: 3 });
    // console.log(tomorrow, dayAfterDayAfterTomorrow)
    const interval1 = luxon.Interval.fromDateTimes(today, tomorrow);
    const interval2 = luxon.Interval.fromDateTimes(tomorrow, dayAfterTomorrow);
    const interval3 = luxon.Interval.fromDateTimes(dayAfterTomorrow, dayAfterDayAfterTomorrow);

    // 今日提出の課題
    // タスクを完了しているかどうかについては関係なし
    if (interval1.contains(dt)) {
      tasksTodaySubmit.push([card.name, dt.toFormat('yyyy-MM-dd HH:mm')])
    }

    // 完了している もしくは期限が設定してされていないものを取り除く
    if (card.dueComplete || card.due === null) {
      continue;
    }

    else {
      if (elapsed < 0) {
        taskDueOver.push(card.name)
      }
      // 明日提出の課題のうちまだ終わっていないもの
      // 今日やるべき課題
      else if (interval2.contains(dt)) {
        tasksToday.push([card.name, dt.toFormat('yyyy-MM-dd HH:mm')])
      }
      // 明後日提出の課題のうちまだ終わっていないもの
      // 明日までにやるべき課題
      else if (interval3.contains(dt)) {
        tasksTomorrow.push([card.name, dt.toFormat('yyyy-MM-dd HH:mm')])
      }
    }
  }
  let attachments = [{
    "color": "#3104B4",
    "title": "今日提出の課題",
    "fields": [
    ]
  }, {
    "color": "#F104F4",
    "title": "今日取り組む課題",
    "fields": [
    ]
  }, {
    "color": "#210224",
    "title": "明日取り組む課題",
    "fields": [
    ]
  }
  ]
  for (let i = 0; i < tasksTodaySubmit.length; i++) {
    const element = tasksTodaySubmit[i];
    console.log(...element);
    attachments[0].fields.push({
      "title": element[0],
      "value": `期限: ${element[1]}`
    });
  }
  for (let i = 0; i < tasksToday.length; i++) {
    const element = tasksToday[i];
    attachments[1].fields.push({
      "title": element[0],
      "value": `期限: ${element[1]}`
    });
  }
  for (let i = 0; i < tasksTomorrow.length; i++) {
    const element = tasksTomorrow[i];
    attachments[2].fields.push({
      "title": element[0],
      "value": `期限: ${element[1]}`
    });
  }

  if (tasksTodaySubmit.length === 0) {
    attachments[0].text = "今日提出の課題はありません。"
  }
  if (tasksToday.length === 0) {
    attachments[1].text = "今日取り組む課題はありません。"
  }
  if (tasksTomorrow.length === 0) {
    attachments[2].text = "明日取り組む課題はありません。"
  }

  return attachments;
};

async function weekTask() {
  const res = await client.get(path, params)
  const now = new Date()
  const data = res.data

  const tasksWeek = []
  const taskDueOver = []

  const tmp = DateTime.local().toSQLDate();
  const today = DateTime.fromISO(tmp);
  const nextWeek = today.plus({ days: 7 });
  const interval1 = luxon.Interval.fromDateTimes(today, nextWeek);

  for (let i = 0; i < data.length; i++) {
    const card = data[i];
    const taskDue = new Date(card.due)
    const dt = DateTime.fromISO(card.due).toLocal();
    const elapsed = taskDue.getTime() - now.getTime()

    // 完了している もしくは期限が設定してされていないものを取り除く
    if (card.dueComplete || card.due === null) {
      // continue;  
    }

    else {
      if (elapsed < 0) {
        taskDueOver.push(card.name)
      }
      // 明日提出の課題のうちまだ終わっていないもの
      // 今日やるべき課題
      else if (interval1.contains(dt)) {
        tasksWeek.push([card.name, dt.toFormat('yyyy-MM-dd HH:mm')])
      }
    }
  }
  let attachments = [{
    "color": "#3104B4",
    "title": "今週の課題",
    "fields": [
    ]
  }, {
    "color": "#3104B4",
    "title": "期限切れの課題",
    "fields": [
    ]
  }]
  for (let i = 0; i < tasksWeek.length; i++) {
    const element = tasksWeek[i];
    attachments[0].fields.push({
      "title": element[0],
      "value": `期限: ${element[1]}`
    });
  }
  for (let i = 0; i < taskDueOver.length; i++) {
    const element = taskDueOver[i];
    attachments[1].fields.push({
      "title": element,
      "value": "期限切れ"
    });
  }
  if (tasksWeek.length === 0) {
    attachments[0].text = "課題はありません";
  }
  if (taskDueOver.length === 0) {
    attachments[1].text = "期限切れの課題はありません";
  }
  const reply = { attachments: attachments }

  const weekMessage = tasksWeek.length !== 0 ? `今週までの課題は\n${tasksWeek.toString()}\nですよ。頑張ってくださいね。\n` : "今週までの課題はありませんよ。ゆっくり休んでくださいね。\n";
  const dueOverMessage = taskDueOver.length !== 0 ? `期限切れのタスクが存在しますね。期限が切れてしまったタスクは\n${taskDueOver.toString()}\nです。` : `期限切れのタスクはありません。`
  const replyMessage = weekMessage + dueOverMessage;
  return attachments;
};

