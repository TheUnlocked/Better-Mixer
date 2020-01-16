import BTTVChannel from "./BTTVChannel.js";
import BetterMixer from "../../BetterMixer.js";
import TwitchChannel from "../Twitch/TwitchChannel.js";
import EmoteSet from "../../EmoteSet.js";
import Emote from "../../Emote.js";
import { fetchJson } from "../../Utility/Util.js";
import { GatherEmotesEvent, GatherEmotesResult } from "Extension/content/BetterMixerEvent.js";

export default class BTTVAddon {
    plugin: BetterMixer;
    globalEmotes: EmoteSet;

    private _gatherEmotes?: (event: GatherEmotesEvent) => GatherEmotesResult | undefined;
    
    constructor(plugin: BetterMixer) {
        this.plugin = plugin;
        this.globalEmotes = new EmoteSet("BTTV Global Emotes", -60);
        this.init();
    }

    async init() {
        try {
            const data: {
                urlTemplate: string;
                emotes: {
                    id: string;
                    channel: string;
                    code: string;
                    imageType: string;
                }[];
            } = await fetchJson('https://api.betterttv.net/2/emotes');
            for (const emote of data.emotes) {
                const animated = ['gif'].includes(emote.imageType);
                this.globalEmotes.addEmote(new Emote(emote.code, `https:${data.urlTemplate.replace('{{id}}', emote.id).replace('{{image}}', '3x')}`, 28, 28, animated));
            }
            
            this._gatherEmotes = event => {
                if (event.data.channel.channelSettings.bttv && event.data.channel.channelSettings.bttv.globals) {
                    return this.globalEmotes;
                }
            };
            this.plugin.addEventListener('gatherEmotes', this._gatherEmotes);
            this.plugin.dispatchEvent('emotesAdded', [this.globalEmotes], this);

            this.plugin.log(`Fetched global BTTV emotes.`, BetterMixer.LogType.INFO);
        } catch (err) {
            this.plugin.log(`${err.message}: Failed to load global emotes from BTTV.`, BetterMixer.LogType.INFO);
        }
    }

    getSync(channel: TwitchChannel) {
        return new BTTVChannel(this, channel);
    }
}
