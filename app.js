require('dotenv').config()
const { Client, MessageAttachment  } = require('discord.js')
const client = new Client()
const randomFile = require('select-random-file')

const dir = './src/images'

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', msg => {
  if (msg.content.toUpperCase() === 'SÃO ELES') {
    randomFile(dir, (err, file) => {
      console.log("FILE ===== ", file)
      const attachment = new MessageAttachment(`./src/images/${file}`)
      msg.channel.send(attachment)
    })
  }
})

client.login(process.env.BOT_TOKEN)