process.env.DRSS = true
const Discord = require('discord.js')
const config = require('../config.js')
const connectDb = require('../rss/db/connect.js')
const Patron = require('./db/Patron.js')
const Supporter = require('./db/Supporter.js')
const log = require('../util/logger.js')
const EventEmitter = require('events')
const maintenance = require('../util/maintenance/index.js')
const initialize = require('../util/initialization.js')
const ipc = require('../util/ipc.js')

class ClientManager extends EventEmitter {
  /**
   * @param {Object<string, any>} settings
   * @param {Object<string, Object<string, any>>} customSchedules
   */
  constructor (settings, customSchedules = {}) {
    super()
    if (settings.config) {
      config._overrideWith(settings.config)
    }
    this.config = settings.config
    this.suppressLogLevels = settings.suppressLogLevels
    this.setPresence = settings.setPresence
    this.maintenance = maintenance.cycle()
    this.customSchedules = customSchedules
    this.guildIdsByShard = new Map()
    this.channelIdsByShard = new Map()
    this.refreshRates = new Set()
    this.activeshardIds = []
    this.scheduleIntervals = [] // Array of intervals for each different refresh time
    this.scheduleTracker = {} // Key is refresh time, value is index for this.activeshardIds
    this.shardsReady = 0 // Shards that have reported that they're ready
    this.shardsDone = 0 // Shards that have reported that they're done initializing
    this.shardingManager = new Discord.ShardingManager('./server-shard.js', { respawn: false })
    this.shardingManager.on('shardCreate', shard => {
      shard.on('message', message => this.messageHandler(shard, message))
    })
  }

  async run (shardCount = config.advanced.shards) {
    try {
      await connectDb()
      const schedules = await initialize.populateSchedules(this.customSchedules)
      schedules.forEach(schedule => this.refreshRates.add(schedule.refreshRateMinutes))
      if (config.web.enabled === true) {
        require('../web/index.js')()
      }
      this.shardingManager.spawn(shardCount, 5500, -1)
    } catch (err) {
      log.general.error(`ClientManager db connection`, err)
    }
  }

  messageHandler (shard, message) {
    if (!ipc.isValid(message)) {
      return
    }
    if (ipc.isLoopback(message)) {
      return this.shardingManager.broadcast(message)
        .catch(err => this._handleErr(err, message))
    }
    switch (message.type) {
      case ipc.TYPES.KILL: this.kill(); break
      case ipc.TYPES.SHARD_READY: this._shardReadyEvent(shard, message); break
      case ipc.TYPES.INIT_COMPLETE: this._initCompleteEvent(); break
      case ipc.TYPES.SCHEDULE_COMPLETE: this._scheduleCompleteEvent(message); break
    }
  }

  kill () {
    this.shardingManager.shards.forEach(shard => {
      shard.kill()
    })
    process.exit(0)
  }

  _handleErr (err, message) {
    log.general.error(`Sharding Manager broadcast message handling error for message type ${message.type}`, err, true)
    this.kill()
  }

  _shardReadyEvent (shard, message) {
    const totalShards = this.shardingManager.totalShards
    this.activeshardIds.push(shard.id)
    message.data.guildIds.forEach(id => {
      this.guildIdsByShard.set(id, shard.id)
    })
    message.data.channelIds.forEach(id => {
      this.channelIdsByShard.set(id, shard.id)
    })
    if (++this.shardsReady < totalShards) {
      return
    }
    maintenance.prunePreInit(this.guildIdsByShard, this.channelIdsByShard)
      .then(() => {
        this.shardingManager.broadcast({
          _drss: true,
          type: ipc.TYPES.START_INIT,
          data: {
            config: this.config || {},
            suppressLogLevels: this.suppressLogLevels || [],
            setPresence: this.setPresence || false,
            customSchedules: this.customSchedules || []
          }
        })
      }).catch(err => {
        log.general.error('Failed to execute prune pre init in sharding manager', err)
      })
  }

  _initCompleteEvent () {
    // Count all the links
    if (++this.shardsDone === this.shardingManager.totalShards) {
      log.general.info(`All shards have initialized by the Sharding Manager.`)
      maintenance.prunePostInit(this.guildIdsByShard)
        .then(() => {
          if (Supporter.enabled) {
            return Patron.refresh()
          }
        })
        .then(() => {
          // Create feed schedule intervals
          this.createIntervals()
          this.shardingManager.broadcast({
            _drss: true,
            type: ipc.TYPES.FINISHED_INIT
          })
          this.emit('finishInit')
        })
        .catch(err => {
          log.general.error(`Post-initialization failed in sharding manager`, err, true)
        })
    }
  }

  _scheduleCompleteEvent (message) {
    const { refreshRate } = message.data
    this.scheduleTracker[refreshRate]++ // Index for this.activeshardIds
    if (this.scheduleTracker[refreshRate] !== this.shardingManager.totalShards) {
      // Send signal for next shard to start cycle
      const broadcast = {
        _drss: true,
        type: ipc.TYPES.RUN_SCHEDULE,
        data: {
          shardId: this.activeshardIds[this.scheduleTracker[refreshRate]],
          refreshRate
        }
      }
      this.shardingManager.broadcast(broadcast).catch(err => this._handleErr(err, message))
    }
  }

  createIntervals () {
    const initiateCycles = refreshRate => () => {
      let p
      for (p = 0; p < config.advanced.parallelShards && p < this.activeshardIds.length; ++p) {
        this.scheduleTracker[refreshRate] = p // Key is the refresh time, value is the this.activeshardIds index. Set at 0 to start at the first index. Later indexes are handled by the 'scheduleComplete' message
        this.shardingManager.broadcast({
          _drss: true,
          type: ipc.TYPES.RUN_SCHEDULE,
          data: {
            shardId: this.activeshardIds[p],
            refreshRate
          }
        })
      }
    }

    // The "master interval" for a particular refresh time to determine when shards should start running their schedules
    this.refreshRates.forEach(refreshRate => {
      this.scheduleIntervals.push(setInterval(initiateCycles(refreshRate).bind(this), refreshRate * 60000))
    })
    // Immediately start the default retrieval cycles with the specified refresh rate
    initiateCycles(config.feeds.refreshRateMinutes)()
  }
}

module.exports = ClientManager
