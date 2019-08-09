import Emote from "../../Emote.js";
import BetterMixer from "../../BetterMixer.js";
import BTTVAddon from "./BTTVAddon.js";
import TwitchChannel from "../Twitch/TwitchChannel.js";
import EmoteSet from "../../EmoteSet.js";

export default class BTTVChannel{
    /**
     * @param {BTTVAddon} parent 
     * @param {TwitchChannel} channel
     * @param {string} username 
     */
    constructor(parent, channel) {
        this.bttv = parent;
        this.plugin = parent.plugin;
        this.channel = channel.channel;
        this.twitch = channel;
        this.emotes = new EmoteSet("BTTV Channel Emotes", 80);

        let load = () => {
            if (!this.twitch.login){
                setTimeout(load, 100);
                return;
            }

                  /* Backwards Compatibility */
            if (!this.channel.channelSettings.bttv || this.channel.channelSettings.bttv.sync){
                $.ajax({
                    url: `https://api.betterttv.net/2/channels/${this.twitch.login}`,
                    dataType: 'json',
                    async: false,
                    success: data => {
                        for (let emote of data.emotes) {
                            let animated = ['gif'].includes(emote.imageType);
                            this.emotes.addEmote(new Emote(emote.code, `https:${data.urlTemplate.replace('{{id}}', emote.id).replace('{{image}}', '3x')}`, 28, 28, animated));
                        }
                        
                        this._gatherEmotes = event => {
                            if (event.data.channel === this.channel){
                                return this.emotes;
                            }
                        };
                        this.plugin.addEventListener(BetterMixer.Events.GATHER_EMOTES, this._gatherEmotes);

                        this.plugin.log(`Synced ${this.channel.owner.username} with BTTV emotes from ${this.twitch.login}.`, BetterMixer.LogType.INFO);
                    },
                    error: xhr => this.plugin.log(`${xhr.statusText}: Failed to load emotes from BTTV.`, BetterMixer.LogType.INFO)
                });
            }
        };
        load();
    }

    unload(){
        this.plugin.removeEventListener(BetterMixer.Events.GATHER_EMOTES, this._gatherEmotes);
    }
}
