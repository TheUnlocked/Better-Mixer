import Emote from "../../Emote.js";
import BetterMixer from "../../BetterMixer.js";
import FFZAddon from "./FFZAddon.js";
import Channel from "../../Channel.js";

export default class FFZChannel{
    /**
     * @param {FFZAddon} parent 
     * @param {Channel} channel
     * @param {string} username 
     */
    constructor(parent, channel, username) {

        this.ffz = parent;
        this.plugin = parent.plugin;
        this.channel = channel;
        this.twitch = username;
        this.emotes = [];

        $.ajax({
            url: `https://api.frankerfacez.com/v1/room/${username}`,
            dataType: 'json',
            async: false,
            success: data => {
                for (let emoteSet in data.sets) {
                    for (let emote of data.sets[emoteSet].emoticons) {
                        this.emotes.push(new Emote(emote.name, emote.urls['1'], emote.width, emote.height));
                    }
                }
                
                this._gatherEmotes = event => {
                    if (event.data.channel === this.channel){
                        return this.emotes;
                    }
                };
                this.plugin.addEventListener(BetterMixer.Events.GATHER_EMOTES, this._gatherEmotes);

                this.plugin.log(`Synced ${this.channel.owner.username} with FFZ emotes from ${this.twitch}.`, BetterMixer.LogType.INFO)
            },
            error: xhr => this.plugin.log(`${xhr.statusText}: Failed to load emotes from FFZ.`, BetterMixer.LogType.WARNING)
        });

    }

    unload(){
        this.plugin.removeEventListener(BetterMixer.Events.GATHER_EMOTES, this._gatherEmotes);
    }
}