import BetterMixer from "../../BetterMixer.js";
import TwitchAddon from "./TwitchAddon.js";
import Channel from "../../Channel.js";

export default class TwitchChannel{
    /**
     * @param {TwitchAddon} parent 
     * @param {Channel} channel
     * @param {string} username 
     */
    constructor(parent, channel, username, id) {
        this.twitch = parent;
        this.plugin = parent.plugin;
        this.channel = channel;
        this.login = username;

        if (username && !id){
            $.ajax({
                url: `https://api.twitch.tv/helix/users?login=${username}`,
                headers: {"Client-ID": "k2dxpcz1dl6fe771vzcsl1bx324osz"},
                dataType: 'json',
                async: false,
                success: data => {
                    this.id = data.data[0].id;
                    this.displayName = data.data[0].display_name;
                },
                error: xhr => this.plugin.log(`${xhr.statusText}: Failed to obtain ID from Twitch username.`, BetterMixer.LogType.WARN)
            });
        }
        else {
            $.ajax({
                url: `https://api.twitch.tv/helix/users?id=${id}`,
                headers: {"Client-ID": "k2dxpcz1dl6fe771vzcsl1bx324osz"},
                dataType: 'json',
                async: false,
                success: data => {
                    this.id = data.data[0].id;
                    this.displayName = data.data[0].display_name;
                },
                error: xhr => this.plugin.log(`${xhr.statusText}: Failed to obtain Twitch user information from provided data.`, BetterMixer.LogType.WARN)
            });
        }
    }

    unload(){
        
    }
}
