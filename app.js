const { Client, MessageAttachment, Message, Channel } = require('discord.js')
const randomFile = require('select-random-file')
const { v4 } = require('uuid')
const formData = require('form-data')
const dotenv = require('dotenv')
const axios = require('axios')
const https = require('https')
const http = require('http')
const path = require('path')
const fs = require('fs')

dotenv.config()

const { BOT_TOKEN, VM_URL, MEDIA_DIR } = process.env

const emojis = {
  ok: '✅',
  error: '⚠',
  deleted: '🗑',
  delete_action: '❌',
  robot_face: '🤖',
}

const client = new Client({
  partials: [
    'MESSAGE',
    'CHANNEL',
    'REACTION',
  ]
})

const deleteAttachment = async (attachment, removeDir, message = null) => {
  const { name } = attachment
  fs.unlink(`${removeDir}/${name}`, error => {
    if (!error && message) {
      message.react(emojis.deleted)
    } else if (error) {
      if (message) message.react(emojis.error)
      console.error('[ERROR]', error)
    }
  })
}

const downloadAttachment = async (attachment, downloadDir, message = null) => {

  try {
    const { name, url: imageUrl } = attachment

    const ext = path.extname(name)
    const uuid = v4()

    const newName = `${uuid}${ext}`
    const imageDir = `${downloadDir}/${newName}`

    const request = await https.get(imageUrl, response => {
      const file = fs.createWriteStream(imageDir)
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        if (message) message.react(emojis.ok)
      })
    })

  } catch (error) {
    if (message) message.react(emojis.error)
    console.error('[ERROR]', error)
  }

}

const distortAttachment = async ({ attachment, name }, message = null) => {
  try {

    const data = {
      imageUrl: attachment,
      imageName: name
    }

    if (message) message.react(emojis.robot_face)

    await axios.post(VM_URL, data)
      .then(async (response) => {
        console.log("RESPONSE", response)
        const { error, message: responseMessage, imageName } = await response.data

        if (error) {
          if (message) message.react(emojis.error)
          console.error('[ERROR] - ', responseMessage, error)
          return
        }

        setTimeout(function () {
          if (message) {
            message.channel.send(`${VM_URL}${imageName}`)
          }
        }, 1800)
      })

  } catch (error) {
    console.error('[ERROR] - ', error)
  }
}

try {

  client.login(BOT_TOKEN)

  client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
  })

  client.on('message', message => {
    const { content, channel, attachments } = message

    switch (content.toUpperCase()) {
      case 'SÃO ELES':
        randomFile(MEDIA_DIR, (error, file) => {
          const attachment = new MessageAttachment(`${MEDIA_DIR}/${file}`)
          channel.send(attachment)
        })
        break

      case '!MANITOS HELP':
        message.channel.send(`
***Help***
- Para **adicionar** uma imagem/vídeo ao bot basta reagir com o emote :manitos:
- Para **distorcer** uma imagem basta reagir com o emote :distorted_hernans:
- Para **remover** uma imagem/vídeo do bot basta reagir com :x: (necessário 5 pessoas)

***Reações do Bot***
:white_check_mark: = imagem/vídeo adicionado ao bot com sucesso
:warning: = houve um erro ao realizar algum processo
:wastebasket: = imagem/vídeo removido do bot com sucesso
:robot: = iniciado o processo de distorcer a imagem`)
        break

      default:
        break;
    }
  })

  client.on('messageReactionAdd', async reaction => {

    const { emoji, message, count } = reaction

    switch (emoji.name) {
      case 'manitos':
        const { id: messageId, channel } = message
        channel.messages.fetch(messageId)
          .then(channelMessage => {
            const { attachments } = channelMessage
            attachments.forEach(async (attachment) => {
              downloadAttachment(attachment, MEDIA_DIR, message)
            })
          })
          .catch(console.error)

        break

      case emojis.delete_action:
        if (count && count >= 5) {
          const { attachments } = message
          attachments.forEach(attachment => {
            deleteAttachment(attachment, MEDIA_DIR, message)
          })
        }
        break

      case 'distorted_hernans':
        if (count && count <= 1) {
          const { attachments } = message
          attachments.forEach(attachment => {
            distortAttachment(attachment, message)
          })
        }
        break

      default:
        break
    }

  })

} catch (error) {
  console.error('[ERROR] - ', error)
}
