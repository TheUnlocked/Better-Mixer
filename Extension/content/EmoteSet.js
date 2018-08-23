import Emote from "./Emote.js";

export default class EmoteSet {
    /**
     * 
     * @param {String} name
     * @param {Array<Emote>} emotes
     */
    constructor(name, emotes = []){
        this.name = name;
        this.emotes = emotes.slice();
    }

    /**
     * 
     * @param {Emote} emote 
     */
    addEmote(emote){
        this.emotes.push(emote);
    }

    /**
     * 
     * @param {Array<Emote>} emote 
     */
    addEmotes(emote){
        this.emotes = this.emotes.concat(emote);
    }

    /**
     * 
     * @param {Emote} emote 
     */
    removeEmote(emote){
        this.emotes = this.emotes.filter(e => e !== emote);
    }

    clearEmotes(){
        this.emotes = [];
    }
}