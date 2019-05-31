import BTTVChannel from "./BTTVChannel.js";
import BetterMixer from "../../BetterMixer.js";
import TwitchChannel from "../Twitch/TwitchChannel.js";

export default class BTTVAddon {
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
        return new BTTVChannel(this, channel);
    }
}
