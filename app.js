var { v4: uuidv4 } = require('uuid');
var dotenv = require('dotenv')
var { Client, MessageAttachment, Message  } =  require('discord.js')
var randomFile = require('select-random-file')
var https = require('https')
var fs = require('fs')
var path = require('path')

dotenv.config()

const client = new Client()

const download = function(url, dest, msg) {
  var file = fs.createWriteStream(dest)
  var request = https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close()
      msg.channel.send("Foto adicionada :white_check_mark:")
    })
  }).on('error', function(err) {
    msg.channel.send("Não foi possivel adicionar essa foto :x:")
    fs.unlink(dest)
  })
}

const dir = './src/images'

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', msg => {
  if (msg.content.toUpperCase() === 'SÃO ELES') {
    randomFile(dir, (err, file) => {
      const attachment = new MessageAttachment(`./src/images/${file}`)
      msg.channel.send(attachment)
    })
  } else if(msg.content === "!manitos") {
    msg.attachments.forEach(a => {
      const ext = path.extname(a.name)
      const name = uuidv4()
      download(a.url, `${dir}/${name}${ext}`, msg)
    })
  }
})

client.login(process.env.BOT_TOKEN)