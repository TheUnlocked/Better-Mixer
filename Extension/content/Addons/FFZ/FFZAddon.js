import FFZChannel from "./FFZChannel.js";
import BetterMixer from "../../BetterMixer.js";
import TwitchChannel from "../Twitch/TwitchChannel.js";
import EmoteSet from "../../EmoteSet.js";
import Emote from "../../Emote.js";
import { fetchJson } from "../../Utility/Util.js";

export default class FFZAddon {
    /**
     * 
     * @param {BetterMixer} plugin 
     */
    constructor(plugin) {
        this.plugin = plugin;
        this.globalEmotes = new EmoteSet("FFZ Global Emotes", -50);
        this.init();
    }

    async init(){
        try {
            const data = await fetchJson('https://api.frankerfacez.com/v1/set/global');
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
            this.plugin.dispatchEvent(BetterMixer.Events.ON_EMOTES_ADDED, [this.emotes], this);

            this.plugin.log(`Fetched global FFZ emotes.`, BetterMixer.LogType.INFO);
        } catch(err){
            this.plugin.log(`${err.message}: Failed to load global emotes from FFZ.`, BetterMixer.LogType.INFO);
        }
    }

    /**
     * @param {TwitchChannel} channel 
     */
    getSync(channel){
        return new FFZChannel(this, channel);
    }
}