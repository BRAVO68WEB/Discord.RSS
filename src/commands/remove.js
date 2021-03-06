const config = require('../config.js')
const FeedSelector = require('../structs/FeedSelector.js')
const MenuUtils = require('../structs/MenuUtils.js')
const log = require('../util/logger.js')
const Translator = require('../structs/Translator.js')
const Profile = require('../structs/db/Profile.js')
const Feed = require('../structs/db/Feed.js')

module.exports = async (bot, message, command) => {
  try {
    const profile = await Profile.get(message.guild.id)
    const guildLocale = profile ? profile.locale : undefined
    const translate = Translator.createLocaleTranslator(guildLocale)
    const feeds = await Feed.getManyBy('guild', message.guild.id)
    const feedSelector = new FeedSelector(message, null, { command, locale: guildLocale, multiSelect: true }, feeds)
    const data = await new MenuUtils.MenuSeries(message, [feedSelector], { locale: guildLocale }).start()
    if (!data) return
    const { selectedFeeds } = data
    const removing = await message.channel.send(translate('commands.remove.removing'))
    const errors = []
    let removed = translate('commands.remove.success') + '\n```\n'
    for (const feed of selectedFeeds) {
      const link = feed.url
      try {
        await feed.delete()
        removed += `\n${link}`
        log.guild.info(`Removed feed ${link}`, message.guild)
      } catch (err) {
        log.guild.error(`Failed to remove feed ${link}`, message.guild, err, true)
        errors.push(err)
      }
    }
    const prefix = profile && profile.prefix ? profile.prefix : config.bot.prefix
    if (errors.length > 0) {
      await removing.edit(translate('commands.remove.internalError'))
    } else await removing.edit(`${removed}\`\`\`\n\n${translate('generics.backupReminder', { prefix })}`)
  } catch (err) {
    log.command.warning(`rssremove`, message.guild, err)
    if (err.code !== 50013) message.channel.send(err.message).catch(err => log.command.warning('rssremove 1', message.guild, err))
  }
}
