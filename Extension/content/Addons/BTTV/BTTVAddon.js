import BTTVChannel from "./BTTVChannel.js";
import BetterMixer from "../../BetterMixer.js";
import TwitchChannel from "../Twitch/TwitchChannel.js";
import EmoteSet from "../../EmoteSet.js";
import Emote from "../../Emote.js";

export default class BTTVAddon {
    /**
     * 
     * @param {BetterMixer} plugin 
     */
    constructor(plugin) {
        this.plugin = plugin;
        this.globalEmotes = new EmoteSet("BTTV Global Emotes");

        $.ajax({
            url: `https://api.betterttv.net/2/emotes/`,
            dataType: 'json',
            async: false,
            success: data => {
                for (let emote of data.emotes) {
                    let animated = ['gif'].includes(emote.imageType);
                    this.globalEmotes.addEmote(new Emote(emote.code, `https:${data.urlTemplate.replace('{{id}}', emote.id).replace('{{image}}', '3x')}`, undefined, 28, animated));
                }
                
                this._gatherEmotes = event => {
                    if (event.data.channel.channelSettings.bttv && event.data.channel.channelSettings.bttv.globals){
                        return this.globalEmotes;
                    }
                };
                this.plugin.addEventListener(BetterMixer.Events.GATHER_EMOTES, this._gatherEmotes);

                this.plugin.log(`Fetched global BTTV emotes.`, BetterMixer.LogType.INFO);
            },
            error: xhr => this.plugin.log(`${xhr.statusText}: Failed to load global emotes from BTTV.`, BetterMixer.LogType.INFO)
        });
    }

    /**
     * @param {TwitchChannel} channel 
     */
    getSync(channel){
        return new BTTVChannel(this, channel);
    }
}
