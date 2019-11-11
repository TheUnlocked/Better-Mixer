import Emote from "./Emote.js";

export default class EmoteSet {
    /**
     * 
     * @param {String} name
     * @param {Number} priority {default: 0, uncategorized: -100, mixerGlobal: -200, thisChannelSubs: 100, otherChannelSubs: 50}
     * @param {Array<Emote>} emotes
     */
    constructor(name, priority = 0, emotes = []) {
        this.name = name;
        this.priority = priority;
        this.emotes = emotes.slice();
    }

    /**
     * 
     * @param {Emote} emote 
     */
    addEmote(emote) {
        this.emotes.push(emote);
    }

    /**
     * 
     * @param {Array<Emote>} emote 
     */
    addEmotes(emote) {
        this.emotes = this.emotes.concat(emote);
    }

    /**
     * 
     * @param {Emote} emote 
     */
    removeEmote(emote) {
        this.emotes = this.emotes.filter(e => e !== emote);
    }

    clearEmotes() {
        this.emotes = [];
    }
}