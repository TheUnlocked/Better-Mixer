import BetterMixer from "../../BetterMixer.js";
import TwitchAddon from "./TwitchAddon.js";
import Channel from "../../Channel.js";
import { requestJson } from "../../Util.js";

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

        const requestConfig = { headers: { "Client-ID": "k2dxpcz1dl6fe771vzcsl1bx324osz" } };

        if (username && !id){
            requestJson(`https://api.twitch.tv/helix/users?login=${username}`, requestConfig)
                .then(data => {
                    this.id = data.data[0].id;
                    this.displayName = data.data[0].display_name;
                })
                .catch(err => {
                    this.plugin.log(`${err.message}: Failed to obtain ID from Twitch username.`, BetterMixer.LogType.WARN);
                });
        }
        else {
            requestJson(`https://api.twitch.tv/helix/users?id=${id}`)
                .then(data => {
                    this.id = data.data[0].id;
                    this.displayName = data.data[0].display_name;
                })
                .catch(err => {
                    this.plugin.log(`${err.message}: Failed to obtain Twitch user information from provided data.`, BetterMixer.LogType.WARN);
                });
        }
    }

    unload(){
        
    }
}
