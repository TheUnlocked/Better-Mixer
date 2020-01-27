import Emote from "../../Emote.js";
import BetterMixer from "../../BetterMixer.js";
import BTTVAddon from "./BTTVAddon.js";
import TwitchChannel from "../Twitch/TwitchChannel.js";
import EmoteSet from "../../EmoteSet.js";
import { fetchJson, waitFor } from "../../Utility/Promise.js";
import { GatherEmotesEvent, GatherEmotesResult } from "Extension/content/BetterMixerEvent.js";
import Channel from "Extension/content/Channel.js";

export default class BTTVChannel {
    bttv: BTTVAddon;
    plugin: BetterMixer;
    channel: Channel;
    twitch: TwitchChannel;
    emotes: EmoteSet;
    cancelLoad?: boolean;

    private _gatherEmotes?: (event: GatherEmotesEvent) => GatherEmotesResult | undefined;

    constructor(parent: BTTVAddon, channel: TwitchChannel) {
        this.bttv = parent;
        this.plugin = parent.plugin;
        this.channel = channel.channel;
        this.twitch = channel;
        this.emotes = new EmoteSet("BTTV Channel Emotes", 80);
        this.init();
    }

    async init() {
        await waitFor(() => this.twitch.login);

        /* Backwards Compatibility */
        if (!this.channel.channelSettings.bttv || this.channel.channelSettings.bttv.sync) {
            try {
                const data = await fetchJson(`https://api.betterttv.net/2/channels/${this.twitch.login}`);
                if (this.cancelLoad) return;

                for (const emote of data.emotes) {
                    const animated = ['gif'].includes(emote.imageType);
                    this.emotes.addEmote(new Emote(emote.code, `https:${data.urlTemplate.replace('{{id}}', emote.id).replace('{{image}}', '3x')}`, 28, 28, animated));
                }
                
                this._gatherEmotes = event => {
                    if (event.data.channel === this.channel) {
                        return this.emotes;
                    }
                };

                this.plugin.addEventListener('gatherEmotes', this._gatherEmotes);
                this.plugin.dispatchEvent('emotesAdded', [this.emotes], this);

                this.plugin.log(`Synced ${this.channel.owner!.username} with BTTV emotes from ${this.twitch.login}.`, BetterMixer.LogType.INFO);
            } catch (err) {
                if (this.cancelLoad) return;
                this.plugin.log(`${err.message}: Failed to load emotes from BTTV.`, BetterMixer.LogType.INFO);
            }
        }
    }

    unload() {
        this.cancelLoad = true;
        this._gatherEmotes && this.plugin.removeEventListener('gatherEmotes', this._gatherEmotes);
    }
}
