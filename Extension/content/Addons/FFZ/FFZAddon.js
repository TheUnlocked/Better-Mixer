import FFZChannel from "./FFZChannel.js";
import BetterMixer from "../../BetterMixer.js";
import Channel from "../../Channel.js";

export default class FFZAddon {
    /**
     * 
     * @param {BetterMixer} plugin 
     */
    constructor(plugin) {

        this.plugin = plugin;

        $.ajax({
            url: `https://raw.githubusercontent.com/TheUnlocked/Better-Mixer/master/Info/ffzsync.json`,
            dataType: 'json',
            async: false,
            success: data => {
                this._syncList = data;
            },
            error: xhr => this.plugin.log(`${xhr.statusText}: Failed to access FFZ sync list.`, BetterMixer.LogType.ERROR)
        });
    }

    /**
     * @param {Channel} channel 
     */
    getSync(channel){
        let twitchName = this._syncList[channel.owner.username.toLowerCase()];
        if (twitchName){
            return new FFZChannel(this, channel, twitchName);
        }
        this.plugin.log(`${channel.owner.username} is not FFZ synced.`, BetterMixer.LogType.WARNING);
        return undefined;
    }
}