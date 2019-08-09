import FFZChannel from "./FFZChannel.js";
import BetterMixer from "../../BetterMixer.js";
import TwitchChannel from "../Twitch/TwitchChannel.js";
import EmoteSet from "../../EmoteSet.js";
import Emote from "../../Emote.js";

export default class FFZAddon {
    /**
     * 
     * @param {BetterMixer} plugin 
     */
    constructor(plugin) {
        this.plugin = plugin;
        this.globalEmotes = new EmoteSet("FFZ Global Emotes", -50);

        $.ajax({
            url: `https://api.frankerfacez.com/v1/set/global`,
            dataType: 'json',
            async: false,
            success: data => {
                for (let emoteSet in data.sets) {
                    if (data.default_sets.includes(+emoteSet)){
                        for (let emote of data.sets[emoteSet].emoticons) {
                            let emoteUrl = emote.urls['4'];
                            if (!emoteUrl)
                                emoteUrl = emote.urls['2'];
                            if (!emoteUrl)
                                emoteUrl = emote.urls['1'];
                            this.globalEmotes.addEmote(new Emote(emote.name, emoteUrl, emote.width, emote.height));
                        }
                    }
                }
                
                this._gatherEmotes = event => {
                    if (event.data.channel.channelSettings.ffz && event.data.channel.channelSettings.ffz.globals){
                        return this.globalEmotes;
                    }
                };
                this.plugin.addEventListener(BetterMixer.Events.GATHER_EMOTES, this._gatherEmotes);

                this.plugin.log(`Fetched global FFZ emotes.`, BetterMixer.LogType.INFO);
            },
            error: xhr => this.plugin.log(`${xhr.statusText}: Failed to load global emotes from FFZ.`, BetterMixer.LogType.INFO)
        });
    }

    /**
     * @param {TwitchChannel} channel 
     */
    getSync(channel){
        return new FFZChannel(this, channel);
    }
}