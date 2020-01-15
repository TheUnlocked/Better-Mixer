import BTTVChannel from "./BTTVChannel.js";
import BetterMixer from "../../BetterMixer.js";
import TwitchChannel from "../Twitch/TwitchChannel.js";
import EmoteSet from "../../EmoteSet.js";
import Emote from "../../Emote.js";
import { fetchJson } from "../../Utility/Util.js";

export default class BTTVAddon {
    /**
     * 
     * @param {BetterMixer} plugin 
     */
    constructor(plugin) {
        this.plugin = plugin;
        this.globalEmotes = new EmoteSet("BTTV Global Emotes", -60);
        this.init();
    }

    async init() {
        try {
            const data = await fetchJson('https://api.betterttv.net/2/emotes/');
            for (const emote of data.emotes) {
                const animated = ['gif'].includes(emote.imageType);
                this.globalEmotes.addEmote(new Emote(emote.code, `https:${data.urlTemplate.replace('{{id}}', emote.id).replace('{{image}}', '3x')}`, undefined, 28, animated));
            }
            
            this._gatherEmotes = event => {
                if (event.data.channel.channelSettings.bttv && event.data.channel.channelSettings.bttv.globals) {
                    return this.globalEmotes;
                }
            };
            this.plugin.addEventListener('gatherEmotes', this._gatherEmotes);
            this.plugin.dispatchEvent('emotesAdded', [this.emotes], this);

            this.plugin.log(`Fetched global BTTV emotes.`, BetterMixer.LogType.INFO);
        } catch (err) {
            this.plugin.log(`${err.message}: Failed to load global emotes from BTTV.`, BetterMixer.LogType.INFO);
        }
    }

    /**
     * @param {TwitchChannel} channel 
     */
    getSync(channel) {
        return new BTTVChannel(this, channel);
    }
}
