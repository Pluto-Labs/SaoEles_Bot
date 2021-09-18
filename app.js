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

const { BOT_TOKEN, VM_URL, MEDIA_DIR, CONVERTED_MEDIA_DIR } = process.env

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

const downloadConverted = async (convertedName, downloadDir, message = null) => {

  try {
    const request = await http.get(`${VM_URL}${convertedName}`, async response => {
      const file = await fs.createWriteStream(`${downloadDir}/${convertedName}`)
      await response.pipe(file)
      await file.on('finish', () => {
        file.close()
        if (message) sendAttachment(`${CONVERTED_MEDIA_DIR}/${convertedName}`, message)
      })
    })
  } catch (error) {
    console.error("[ERROR] - ", error)    
  }

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

const sendAttachment = async (attachmentDir, message) => {
  const attachment = new MessageAttachment(attachmentDir)
  message.channel.send(attachment)
}

const distortAttachment = async ({ attachment, name }, message = null) => {
  try {

    const splitName = name.split('.')
    const convertedName = `${splitName[0]}_converted.${splitName[1]}`

    if (fs.existsSync(`${CONVERTED_MEDIA_DIR}/${convertedName}`)) {
      sendAttachment(`${CONVERTED_MEDIA_DIR}/${convertedName}`, message)
      return
    }

    const data = {
      imageUrl: attachment,
      imageName: name
    }

    if (message) message.react(emojis.robot_face)

    await axios.post(VM_URL, data)
      .then(async (response) => {
        const { error, message: responseMessage, imageName } = await response.data

        if (error) {
          if (message) message.react(emojis.error)
          console.error('[ERROR] - ', responseMessage, error)
          return
        }

        setTimeout(function () {
          if (message) {
            downloadConverted(imageName, CONVERTED_MEDIA_DIR, message)
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
          sendAttachment(`${MEDIA_DIR}/${file}`, message)
        })
        break

      case '!MANITOS HELP':
        message.channel.send(`
***Help***
- Para **adicionar** uma imagem/vídeo ao bot basta reagir com o emote <:manitos:857396162608234496>
- Para **distorcer** uma imagem basta reagir com o emote <:distorted_hernans:878435263389515827>
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
