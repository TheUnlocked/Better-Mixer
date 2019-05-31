import BetterMixer from "../../BetterMixer.js";
import TwitchAddon from "./TwitchAddon.js";
import Channel from "../../Channel.js";

export default class FFZChannel{
    /**
     * @param {TwitchAddon} parent 
     * @param {Channel} channel
     * @param {string} username 
     */
    constructor(parent, channel, username) {

        this.ffz = parent;
        this.plugin = parent.plugin;
        this.channel = channel;
        this.login = username;

        $.ajax({
            url: `https://api.twitch.tv/helix/users?login=${username}`,
            headers: {"Client-ID": "k2dxpcz1dl6fe771vzcsl1bx324osz"},
            dataType: 'json',
            async: false,
            success: data => {
                this.id = data.data[0].id;
                this.displayName = data.data[0].display_name;
            },
            error: xhr => this.plugin.log(`${xhr.statusText}: Failed to obtain ID from Twitch username.`, BetterMixer.LogType.WARNING)
        });
    }

    unload(){
        
    }
}
