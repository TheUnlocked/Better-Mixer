import Emote from "../../Emote.js";
import BetterMixer from "../../BetterMixer.js";
import BTTVAddon from "./BTTVAddon.js";
import Channel from "../../Channel.js";
import EmoteSet from "../../EmoteSet.js";

export default class BTTVChannel{
    /**
     * @param {BTTVAddon} parent 
     * @param {Channel} channel
     * @param {string} username 
     */
    constructor(parent, channel, username) {

        this.bttv = parent;
        this.plugin = parent.plugin;
        this.channel = channel;
        this.twitch = username;
        this.emotes = new EmoteSet("BTTV Channel Emotes");

        $.ajax({
            url: `https://api.betterttv.net/2/channels/${username}`,
            dataType: 'json',
            async: false,
            success: data => {
                for (let emote of data.emotes) {
                    this.emotes.addEmote(new Emote(emote.code, `https:${data.urlTemplate.replace('{{id}}', emote.id).replace('{{image}}', '3x')}`, 28, 28));
                }
                
                this._gatherEmotes = event => {
                    if (event.data.channel === this.channel){
                        return this.emotes;
                    }
                };
                this.plugin.addEventListener(BetterMixer.Events.GATHER_EMOTES, this._gatherEmotes);

                this.plugin.log(`Synced ${this.channel.owner.username} with BTTV emotes from ${this.twitch}.`, BetterMixer.LogType.INFO);
            },
            error: xhr => this.plugin.log(`${xhr.statusText}: Failed to load emotes from BTTV.`, BetterMixer.LogType.WARNING)
        });

    }

    unload(){
        this.plugin.removeEventListener(BetterMixer.Events.GATHER_EMOTES, this._gatherEmotes);
    }
}
