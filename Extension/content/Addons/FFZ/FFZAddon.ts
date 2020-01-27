import FFZChannel from "./FFZChannel.js";
import BetterMixer from "../../BetterMixer.js";
import TwitchChannel from "../Twitch/TwitchChannel.js";
import EmoteSet from "../../EmoteSet.js";
import Emote from "../../Emote.js";
import { fetchJson } from "../../Utility/Promise.js";
import { GatherEmotesEvent, GatherEmotesResult } from "Extension/content/BetterMixerEvent.js";

export default class FFZAddon {
    plugin: BetterMixer;
    globalEmotes: EmoteSet;
    emotes: any;

    private _gatherEmotes?: (event: GatherEmotesEvent) => GatherEmotesResult | undefined;

    constructor(plugin: BetterMixer) {
        this.plugin = plugin;
        this.globalEmotes = new EmoteSet("FFZ Global Emotes", -50);
        this.init();
    }

    async init() {
        try {
            const data = await fetchJson('https://api.frankerfacez.com/v1/set/global');
            for (const emoteSet in data.sets) {
                if (data.default_sets.includes(+emoteSet)) {
                    for (const emote of data.sets[emoteSet].emoticons) {
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
                if (event.data.channel.channelSettings.ffz && event.data.channel.channelSettings.ffz.globals) {
                    return this.globalEmotes;
                }
            };

            this.plugin.addEventListener('gatherEmotes', this._gatherEmotes!);
            this.plugin.dispatchEvent('emotesAdded', [this.emotes], this);

            this.plugin.log(`Fetched global FFZ emotes.`, BetterMixer.LogType.INFO);
        } catch (err) {
            this.plugin.log(`${err.message}: Failed to load global emotes from FFZ.`, BetterMixer.LogType.INFO);
        }
    }

    getSync(channel: TwitchChannel) {
        return new FFZChannel(this, channel);
    }
}