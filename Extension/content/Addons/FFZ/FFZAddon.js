import FFZChannel from "./FFZChannel.js";
import BetterMixer from "../../BetterMixer.js";
import TwitchChannel from "../Twitch/TwitchChannel.js";

export default class FFZAddon {
    /**
     * 
     * @param {BetterMixer} plugin 
     */
    constructor(plugin) {
        this.plugin = plugin;
    }

    /**
     * @param {TwitchChannel} channel 
     */
    getSync(channel){
        return new FFZChannel(this, channel);
    }
}