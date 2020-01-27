import BetterMixer from "../../BetterMixer.js";
import Channel from "../../Channel.js";
import TwitchChannel from "./TwitchChannel.js";
import { fetchJson } from "../../Utility/Promise.js";

export default class TwitchAddon {
    plugin: BetterMixer;

    private _syncList: {[username: string]: string} = {};

    constructor(plugin: BetterMixer) {
        this.plugin = plugin;
        this.init();
    }

    async init() {
        try {
            const data = await fetchJson('https://raw.githubusercontent.com/TheUnlocked/Better-Mixer/master/Info/twitchsync.json');
            this._syncList = data;
            this.plugin.log('Synced Twitch data from github.', BetterMixer.LogType.INFO);
        } catch (err) {
            this.plugin.log(`${err.message}: Failed to access Twitch sync list.`, BetterMixer.LogType.ERROR);
        }
    }

    getSync(channel: Channel) {
        if (channel.channelSettings.twitch) {
            if (channel.channelSettings.twitch.id) {
                return new TwitchChannel(this, channel, channel.channelSettings.twitch.id);
            }
            else if (channel.channelSettings.twitch.name) {
                return new TwitchChannel(this, channel, channel.channelSettings.twitch.name);
            }
        }

        if (!this._syncList) {
            this.plugin.log(`${channel.owner!.username} is either not Twitch synced, or the sync list isn't loading.`, BetterMixer.LogType.INFO);
            return;
        }

        const twitchName = this._syncList[channel.owner!.username.toLowerCase()];
        if (twitchName) {
            return new TwitchChannel(this, channel, twitchName);
        }
        this.plugin.log(`${channel.owner!.username} is not Twitch synced.`, BetterMixer.LogType.INFO);
    }
}