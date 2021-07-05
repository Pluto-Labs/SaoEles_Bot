var { v4: uuidv4 } = require('uuid');
var dotenv = require('dotenv')
var { Client, MessageAttachment, Message  } =  require('discord.js')
var randomFile = require('select-random-file')
var https = require('https')
var fs = require('fs')
var path = require('path')

dotenv.config()

const client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })

const download = function(url, dest, msg = null) {
  var file = fs.createWriteStream(dest)
  var request = https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close()
      if(msg)
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

client.on('messageReactionAdd', async (reaction, user) => {

  if (reaction.emoji.name === "manitos") {

    console.log("AQUI")

    try {

      const { id } = reaction.message

      reaction.message.channel.messages.fetch(id)
      .then(message => {
        const { attachments } = message

        attachments.forEach(a => {
          const ext = path.extname(a.name)
          const name = uuidv4()
          download(a.url, `${dir}/${name}${ext}`)
        })

      })
      .catch(console.error)
      
      reaction.message.react('✅')
    } catch (error) {
      reaction.message.react('❌')
      console.error('Something went wrong when fetching the message: ', error);
      return;
    }
    
  } else if(reaction.emoji.name === '❌' && reaction.count >= 5) {
    const [attachments] = reaction.message.attachments
    fs.unlink(`${dir}/${attachments[1].name}`, error => {
      if(error) {
        console.log(error)
      } else {
        reaction.message.edit("Arquivo removido :broken_heart:")
      }
    })
  }

})

client.login(process.env.BOT_TOKEN)