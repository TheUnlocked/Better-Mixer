import EmoteSet from "../EmoteSet.js";
import { fetchJson } from "../Utility/Util.js";
import { VanillaEmote } from "../Emote.js";

export default class EmoteAutocomplete {
    plugin;
    chat;
    emoteCache;
    element;
    vanillaEmotes;
    autocompleteEmotes;
    _selectionIndex;
    showing = false;
    _query;
    _kbEvent;
    _animatedEmotesWereOn;

    constructor(plugin, chat) {
        this.plugin = plugin;
        this.chat = chat;

        this.element = document.createElement('div');
        this.element.classList.add('bettermixer-emote-autocomplete-container');
        
        this.loadVanillaEmoteCache();
    }

    async loadVanillaEmoteCache() {
        this.vanillaEmotes = [];
        await this.plugin.user.populateUser();
        const fetch1 = fetchJson(`https://mixer.com/api/v1/channels/${this.chat.channel.id}/emoticons?user=${this.plugin.user.userId}`)
            .then(data => {
                for (const emoteGroup of data) {
                    const src = emoteGroup.url;
                    const emotes = Object.entries(emoteGroup.emoticons)
                        .map(emote => new VanillaEmote(emote[0], src, { 
                            x: emote[1].x,
                            y: emote[1].y,
                            width: emote[1].width,
                            height: emote[1].height
                        }));
                    this.vanillaEmotes.push(...emotes);
                    this.plugin.log(`Loaded ${emotes.length} vanilla user emotes`);
                }
            })
            .catch(() => this.plugin.log("Failed to load vanilla user emotes", BetterMixer.LogType.WARN));
        const fetch2 = fetchJson("https://mixer.com/_latest/assets/emoticons/manifest.json")
            .then(data => {
                for (const emoteGroupName in data) {
                    const src = `https://mixer.com/_latest/assets/emoticons/${emoteGroupName}.png`;
                    const emoteGroup = data[emoteGroupName];
                    const emotes = Object.entries(emoteGroup.emoticons)
                        .map(emote => new VanillaEmote(emote[0], src, { 
                            x: emote[1].x,
                            y: emote[1].y,
                            width: emote[1].width,
                            height: emote[1].height
                        }));
                    this.vanillaEmotes.push(...emotes);
                    this.plugin.log(`Loaded ${emotes.length} vanilla global emotes`);
                }
            })
            .catch(() => this.plugin.log("Failed to load vanilla global emotes", BetterMixer.LogType.WARN));
        fetch1.finally(() => fetch2.finally(() => {
            // Remove the built-in event listener
            const ta = this.chat.element.querySelector('textarea');
            const initialCount = ta.eventListeners().length;
            for (const listener of ta.eventListeners()) {
                if (listener.name === "") {
                    ta.removeEventListener('keydown', listener);
                    if (ta.eventListeners().length !== initialCount) {
                        break;
                    }
                }
            }
            
            this.reloadCache();
        }));
        this.plugin.addEventListener(BetterMixer.Events.ON_EMOTES_ADDED, () => this.reloadCache());    
    }

    reloadCache() {
        const emoteGatherEventData = {
            channel: this.chat.channel,
            user: this.plugin.user,
            message: null
        };
        this.emoteCache = this.vanillaEmotes
            .concat(this.plugin.dispatchGather(BetterMixer.Events.GATHER_EMOTES, emoteGatherEventData, this)
                .reduce((acc, val) => !val ? acc : val instanceof EmoteSet ? acc.concat(val.emotes) : acc.concat(val), []));
        this._animatedEmotesWereOn = this.plugin.configuration.getConfig('show_emotes_animated').state;
        if (!this._animatedEmotesWereOn) {
            this.emoteCache = this.emoteCache.filter(emote => !emote.animated);
        }
        this.plugin.log(`Reloaded autocomplete cache; ${this.emoteCache.length} emotes loaded, including ${this.vanillaEmotes.length} vanilla emotes`);
    }

    open() {
        this.close();
        this.showing = true;
        this.chat.element.querySelector('[class*="webComposerBlock"]').prepend(this.element);
        this.selectionIndex = this.autocompleteEmotes.length - 1;
        this.loadKeyboardEvents();
    }

    close() {
        this.showing = false;
        this.element.remove();
        this.unloadKeyboardEvents();
    }

    /**
     * @param {string} value
     */
    set query(value) {
        this._query = value;
        this.updateContents();
    }

    get query() { return this._query; }

    updateContents() {
        if (!this.emoteCache ||
            this.plugin.configuration.getConfig('show_emotes_animated').state !== this._animatedEmotesWereOn) {
            this.reloadCache();
        }

        this.autocompleteEmotes = this.emoteCache
            .filter(x => x.name.toLowerCase().includes(this.query))
            // Sort decending based on when the query appears, so the
            // name with the earlier occurrance is the closest to the bottom
            .sort((a, b) => b.name.toLowerCase().indexOf(this.query) - a.name.toLowerCase().indexOf(this.query));
        
        if (this.autocompleteEmotes.length > 0) {
            if (this.element) {
                while (this.element.firstChild) {
                    this.element.firstChild.remove();
                }
            }
            const emoteElements = this.autocompleteEmotes.map((emote, index) => {
                const element = document.createElement('div');
                element.classList.add('bettermixer-emote-autocomplete-option');
                const optionBtn = document.createElement('button');
                const image = emote.imageElement;
                image.classList.add('bettermixer-emote-autocomplete-option-image');
                optionBtn.appendChild(image);
                const emoteNameElement = document.createElement('span');
                emoteNameElement.append(emote.name);
                emoteNameElement.classList.add('bettermixer-emote-autocomplete-option-name');
                optionBtn.appendChild(emoteNameElement);
                element.appendChild(optionBtn);
                element.setAttribute("bettermixer-autocomplete-index", index);
                optionBtn.addEventListener('click', () => {
                    this.fillSelectedEmote();
                    setTimeout(() => this.chat.element.querySelector('textarea').dispatchEvent(new Event('input')), 0);
                });
                return element;
            });
            emoteElements.forEach(element => this.element.appendChild(element));
            
            this.open();
        }
        else {
            this.close();
        }
    }

    loadKeyboardEvents() {
        const ta = this.chat.element.querySelector('textarea');

        const updateCursorAfter = () => setTimeout(() => ta.dispatchEvent(new Event('input')), 0);

        ta.addEventListener('keydown', this._kbEvent = e => {
            switch (e.code) {
                case "Enter":
                case "Tab":
                    this.fillSelectedEmote();
                    updateCursorAfter();
                    break;
                case "ArrowUp":
                    this.selectionIndex--;
                    break;
                case "ArrowDown":
                    this.selectionIndex++;
                    break;
                case "Escape":
                    this.close();
                    break;
                default:
                    if (["ArrowLeft", "ArrowRight"].includes(e.code)) {
                        updateCursorAfter();
                    }
                    return;
            }
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        });
    }

    fillSelectedEmote() {
        const ta = this.chat.element.querySelector('textarea');
        const queryStart = ta.value.lastIndexOf(' ', ta.selectionEnd - 1);
        const selectedEmote = this.autocompleteEmotes[this.selectionIndex].name;
        ta.value = ta.value.slice(0, queryStart + 1) + selectedEmote + ta.value.slice(queryStart + this.query.length + 1);
        if (queryStart + selectedEmote.length + 1 === ta.value.length) {
            ta.value += " ";
        }
        ta.selectionEnd = queryStart + selectedEmote.length + 2;
        ta.selectionStart = ta.selectionEnd;
    }

    unloadKeyboardEvents() {
        this._kbEvent && this.chat.element.querySelector('textarea').removeEventListener('keydown', this._kbEvent);
    }

    get selectionIndex() {
        return this._selectionIndex;
    }

    set selectionIndex(v) {
        const oldSelection = this.element.querySelector(`[bettermixer-autocomplete-index="${this._selectionIndex}"]`);
        if (oldSelection) {
            oldSelection.classList.remove('selected');
        }

        if (v >= this.autocompleteEmotes.length) {
            this._selectionIndex = 0;
        }
        else if (v < 0) {
            this._selectionIndex = this.autocompleteEmotes.length - 1;
        }
        else {
            this._selectionIndex = v;
        }
        const newSelection = this.element.querySelector(`[bettermixer-autocomplete-index="${this._selectionIndex}"]`);
        newSelection.classList.add('selected');
        newSelection.scrollIntoView({ block: "nearest" });
    }
}
