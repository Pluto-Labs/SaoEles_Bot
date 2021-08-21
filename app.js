var { v4: uuidv4 } = require('uuid');
var dotenv = require('dotenv')
var { Client, MessageAttachment, Message } = require('discord.js')
var randomFile = require('select-random-file')
var https = require('https')
var http = require('http')
var fs = require('fs')
var path = require('path')
var axios = require('axios')
var formData = require('form-data')

dotenv.config()

const client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })

const VM_URL = 'http://68.183.157.185:3000/convert/'

const download = function (url, dest, msg = null) {
  var file = fs.createWriteStream(dest)

  const call = url.includes('https') ? https : http

  var request = call.get(url, function (response) {
    response.pipe(file);
    file.on('finish', function () {
      file.close()
      if (msg)
        msg.channel.send("Foto adicionada :white_check_mark:")
    })
  }).on('error', function (err) {
    if (msg) {
      msg.channel.send("Não foi possivel adicionar essa foto :x:")
    }
    fs.unlink(dest)
  })
}

const dir = './src/images'
const convertDir = './src/convertImages'

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', msg => {

  if (msg.content.toUpperCase() === 'SÃO ELES') {
    randomFile(dir, (err, file) => {
      const attachment = new MessageAttachment(`./src/images/${file}`)
      msg.channel.send(attachment)
    })
  } else if (msg.content === "!manitos") {
    msg.attachments.forEach(a => {
      const ext = path.extname(a.name)
      const name = uuidv4()
      download(a.url, `${dir}/${name}${ext}`, msg)
    })
  }

})

client.on('messageReactionAdd', async (reaction, user) => {

  if (reaction.emoji.name === "manitos") {

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

  } else if (reaction.emoji.name === '❌' && reaction.count >= 5) {
    const [attachments] = reaction.message.attachments
    fs.unlink(`${dir}/${attachments[1].name}`, error => {
      if (error) {
        console.log(error)
      } else {
        reaction.message.edit("Arquivo removido :broken_heart:")
      }
    })
  } else if (reaction.emoji.name === "distorted_hernans") {

    const [attachments] = reaction.message.attachments

    const data = {
      imageUrl: attachments[1].attachment,
      imageName: attachments[1].name
    }

    axios.post(VM_URL, data)
      .then((response) => {
        const { data } = response

        if (data.error) {
          console.error(data.message)
          return
        }

        // if (!fs.existsSync(`${convertDir}/${data.imageName}`)) {
        //   download(VM_URL + data.imageName, `${convertDir}/${data.imageName}`)
        // }

        setTimeout(function(){
          // console.log('${convertDir}/${data.imageName}: ', `${convertDir}/${data.imageName}`)
          // const attachment = new MessageAttachment(`${convertDir}/${data.imageName}`)
          reaction.message.channel.send(VM_URL+data.imageName)
      }, 1500)
      }).catch((error) => {
        console.error('Something went wrong when sending image: ', error);
      })

  }

})

client.login(process.env.BOT_TOKEN)