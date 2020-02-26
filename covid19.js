const TelegramBot = require('node-telegram-bot-api');
const puppeteer = require('puppeteer');
const fs = require("fs");

/**
 * This Telegram bot is intended to check the Italian situation 
 * on CoVid-19 reporting automatically every hour (or when requested)
 * 
 *  # To install $: 
 * [ ] git clone https://github.com/peppuz/covid19-bot.git
 * [ ] npm install --save node-telegram-bot-api puppeteer 
 * [ ] node covid19.js
 * 
 * License: MIT
 * Author: Peppuz - peppuzvitale@gmail.com
 */


var data = require('./covid19.json') // file Open a json 
const sito = 'http://www.salute.gov.it/nuovocoronavirus'
const token = '911573383:AAEgF34nKY7-OYtQ2eeoymfI4CGSIM-iL6w';
const bot = new TelegramBot(token, { polling: true });

// Bot Event Handler - Reply to any message incoming
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, data);
});

// Puppeteer scraper
async function BrowserCall() {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewport({ width: 1028, height: 820 })
  await page.goto(sito)
  await page.waitFor(1000)
  const initial_text = await page.$eval("#datiItalia", e => e.textContent)
  console.log("initial_text", initial_text.trim());

  await browser.close()
  console.log('[ ] CLOSING BROWSER ');

  const proc = initial_text.split('\n')

  let text = `Ultimo Aggiornamento da / Last Update from : \n${sito}\n\n`
  for (let a = 0; a < proc.length; a++) {
    const element = proc[a];
    if (element === "" || element === " ")
      continue
    const b = element.trim()
    switch (a) {
      case 4:
        let c = b.split(' ')
        for (let a = 0; a < 5; a++) c.pop(0) // TODO check index  
        text += c.join(' ') + '\n\n' // Add Data e ora last update
        console.log(text);
        break;
      case 15: //positivi
        text += `Positivi al Corona Virus in Italia: ${b}\n`
        break;
      case 23: //deceduti
        text += `Deceduti: ${b}\n`
        break;
      case 31: //Guariti
        text += `Guariti (dimessi): ${b}\n`
        break;
      default:
        break;
    }
  }
  // save for the masses without using a database
  fs.writeFile("data.json", text, (err) => { if (err) console.log(err); console.log("Successfully Written to File."); });
  data = text
}

// Execute now and every 24 hours
let frequency = 60 * 60 * 1000; BrowserCall()  //  call now  and every hour
setInterval(async () => BrowserCall(), frequency)