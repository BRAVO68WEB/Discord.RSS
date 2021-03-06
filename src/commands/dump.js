const log = require('../util/logger.js')
const Discord = require('discord.js')
const FeedSelector = require('../structs/FeedSelector.js')
const MenuUtils = require('../structs/MenuUtils.js')
const FlattenedJSON = require('../structs/FlattenedJSON.js')
const FeedFetcher = require('../util/FeedFetcher.js')
const Translator = require('../structs/Translator.js')
const Profile = require('../structs/db/Profile.js')
const Feed = require('../structs/db/Feed.js')

module.exports = async (bot, message, command) => {
  try {
    const profile = await Profile.get(message.guild.id)
    const guildLocale = profile ? profile.locale : undefined
    const feeds = await Feed.getBy('guild', message.guild.id)
    const feedSelector = new FeedSelector(message, undefined, { command: command }, feeds)
    const data = await new MenuUtils.MenuSeries(message, [feedSelector], { locale: guildLocale }).start()
    if (!data) return
    const translate = Translator.createLocaleTranslator(guildLocale)
    const wait = await message.channel.send(translate('commands.dump.generatingDump'))
    const feed = data.feed
    const url = feed.url
    const { articleList } = await FeedFetcher.fetchFeed(url)
    let textOutput = ''
    let objOutput = []
    const raw = message.content.split(' ')[1] === 'original'
    for (var articleObject of articleList) {
      if (raw) objOutput.push(articleObject)
      else textOutput += new FlattenedJSON(articleObject, feed).text + '\r\n\r\n'
    }
    textOutput = textOutput.trim()
    await wait.edit(translate('commands.dump.generatedDump'))
    await message.channel.send('', new Discord.Attachment(Buffer.from(raw ? JSON.stringify(objOutput, null, 2) : textOutput), raw ? `${url}.json` : `${url}.txt`))
  } catch (err) {
    log.command.warning(`rssdump`, message.guild, err)
    if (err.code !== 50013) message.channel.send(err.message).catch(err => log.command.warning('rssdump 1', message.guild, err))
  }
}
