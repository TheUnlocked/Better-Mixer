import BetterMixer from "../../BetterMixer.js";
import Channel from "../../Channel.js";
import TwitchChannel from "./TwitchChannel.js";

export default class FFZAddon {
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
        if (!this._syncList){
            return;
        }

        let twitchName = this._syncList[channel.owner.username.toLowerCase()];
        if (twitchName){
            return new TwitchChannel(this, channel, twitchName);
        }
        this.plugin.log(`${channel.owner.username} is not Twitch synced.`, BetterMixer.LogType.INFO);
    }
}