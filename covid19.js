const TelegramBot = require('node-telegram-bot-api');
const puppeteer = require('puppeteer');
const fs = require("fs");

/**
 * This Telegram bot is intended to check the Italian situation 
 * on CoVid-19 reporting automatically every hour (or when requested)
 * 
 * License: MIT
 * Author: Peppuz - peppuzvitale@gmail.com
 */

var data = require('./covid19.json') // file Open a json 
const sito = 'http://www.salute.gov.it/nuovocoronavirus'
const token = ''; // ADD HERE YOUR  TOKEN
const bot = new TelegramBot(token, { polling: true });

// Bot Event Handler - Reply to any message incoming
bot.on('message', (msg) => bot.sendMessage(msg.chat.id, data, { parse_mode: 'markdown' }))

// Puppeteer scraper
async function BrowserCall() {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewport({ width: 1028, height: 820 })
  await page.goto(sito)
  await page.waitFor(1000)
  const initial_text = await page.$eval("#datiItalia", e => e.textContent)

  await browser.close()
  console.log('[ ] CLOSING BROWSER ');

  const proc = initial_text.split('\n')

  let text = `Ultimo Aggiornamento da :\n_${sito}_\n\n`
  for (let a = 0; a < proc.length; a++) {
    const element = proc[a];
    if (element === "" || element === " ")
      continue
    const b = element.trim()
    switch (a) {
      case 4:
        let c = b.split(' ')
        // for (let a = 0; a < 3; a++)
        // c.pop(0)
        // c.pop(0)
        text += c.join(' ') + '\n\n' // Add Data e ora last update
        break;
      case 15: //positivi
        text += `*Positivi*: ${b}\n`
        break;
      case 23: //deceduti
        text += `*Deceduti*: ${b}\n`
        break;
      case 31: //Guariti
        text += `*Guariti* (dimessi): ${b}\n`
        break;
      default:
        break;
    }
  }
  console.log("[ ] FULL Text scraped");

  // save for the masses without using a database
  fs.writeFile("./covid19.json", text, (err) => { if (err) console.log(err); console.log("Successfully Written to File."); });
  data = text
}

// Execute now and every 24 hours
let frequency = 60 * 60 * 1000; BrowserCall()  //  call now  and every hour
setInterval(async () => BrowserCall(), frequency)