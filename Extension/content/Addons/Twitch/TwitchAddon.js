import BetterMixer from "../../BetterMixer.js";
import Channel from "../../Channel.js";
import TwitchChannel from "./TwitchChannel.js";

export default class TwitchAddon {
    /**
     * 
     * @param {BetterMixer} plugin 
     */
    constructor(plugin) {

        this.plugin = plugin;

        $.ajax({
            url: `https://raw.githubusercontent.com/TheUnlocked/Better-Mixer/master/Info/twitchsync.json`,
            dataType: 'json',
            async: false,
            success: data => {
                this._syncList = data;
            },
            error: xhr => this.plugin.log(`${xhr.statusText}: Failed to access Twitch sync list.`, BetterMixer.LogType.ERROR)
        });
    }

    /**
     * @param {Channel} channel 
     */
    getSync(channel){
        if (channel.channelSettings.twitch){
            if (channel.channelSettings.twitch.id){
                return new TwitchChannel(this, channel, undefined, channel.channelSettings.twitch.id);
            }
            else if (channel.channelSettings.twitch.name){
                return new TwitchChannel(this, channel, channel.channelSettings.twitch.name, undefined);
            }
        }

        if (!this._syncList){
            return;
        }

        let twitchName = this._syncList[channel.owner.username.toLowerCase()];
        if (twitchName){
            return new TwitchChannel(this, channel, twitchName, undefined);
        }
        this.plugin.log(`${channel.owner.username} is not Twitch synced.`, BetterMixer.LogType.INFO);
    }
}