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
        this._requestConfig = { headers: { "Client-ID": "k2dxpcz1dl6fe771vzcsl1bx324osz" } };

        if (username && !id){
            this._loadByUserName(username);
        }
        else if(id){
            this._loadByUserId(id);
        }
        else{
            this.plugin.log('Failed to obtain Twitch user information.', BetterMixer.LogType.WARN);
        }
    }

    async _loadByUserName(username){
        try {
            this._successHandler(await requestJson(`https://api.twitch.tv/helix/users?login=${username}`, this._requestConfig));
        } catch (err){
            this.plugin.log(`${err.message}: Failed to obtain ID from Twitch username.`, BetterMixer.LogType.WARN);
        }
    }

    async _loadByUserId(id){
        try {
            this._successHandler(await requestJson(`https://api.twitch.tv/helix/users?id=${id}`, this._requestConfig));
        } catch (err){
            this.plugin.log(`${err.message}: Failed to obtain Twitch user information from provided data.`, BetterMixer.LogType.WARN);
        }
    }

    _successHandler(data){
        this.id = data.data[0].id;
        this.displayName = data.data[0].display_name;
        this.plugin.log(`Loaded Twitch user information for ${this.displayName}.`, BetterMixer.LogType.INFO);
    }

    unload(){
        
    }
}
