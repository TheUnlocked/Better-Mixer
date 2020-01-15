import Emote from "./Emote.js";

export default class EmoteSet {
    name: string;
    priority: number;
    emotes: Emote[];

    constructor(
        name: string,
        /** {default: 0, uncategorized: -100, mixerGlobal: -200, thisChannelSubs: 100, otherChannelSubs: 50} */ priority = 0,
        emotes = [] as Emote[]
    ) {
        this.name = name;
        this.priority = priority;
        this.emotes = emotes.slice();
    }

    addEmote(emote: Emote) {
        this.emotes.push(emote);
    }

    addEmotes(emote: Emote[]) {
        this.emotes = this.emotes.concat(emote);
    }

    removeEmote(emote: Emote) {
        this.emotes = this.emotes.filter(e => e !== emote);
    }

    clearEmotes() {
        this.emotes = [];
    }
}