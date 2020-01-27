import Channel from "./Channel.js";
import ChatMessage from "./ChatMessage.js";
import BetterMixer from "./BetterMixer.js";
import Badge from "./Badge.js";
import { observeNewElements } from "./Utility/Promise.js";
import User from "./User.js";
import { GatherBadgesEvent, GatherBadgesResult } from "./BetterMixerEvent.js";

export default class Chat {
    channel: Channel;
    plugin: BetterMixer;
    users: {[username: string]: User} = {};
    element?: HTMLElement;
    subBadge?: Badge;
    staffBadge?: Badge;
    
    private _loaded: boolean;
    private _msgObserver?: MutationObserver;
    private _gatherBadges?: (event: GatherBadgesEvent) => GatherBadgesResult;
    private _emoteDialogObserver?: MutationObserver;

    constructor(channel: Channel) {
        this.channel = channel;
        this.plugin = channel.plugin;
        if (channel.owner) {
            this.users[channel.owner.username] = channel.owner;
        }

        this._loaded = false;
    }

    load(element: HTMLElement) {
        this.element = element;

        if (this._loaded) {
            this.unload();
        }
        else {
            this._loaded = true;
        }
        this._msgObserver = observeNewElements('div[class*="message__"]', this.element, element => {
            const usernameElement = element.querySelectorAll('[class*="Username"]')[0] as HTMLElement;
            if (element.__bettermixerSent || !usernameElement) {
                return;
            }
            const authorName = usernameElement.innerText.split(" ")[0];
            const msg = new ChatMessage(this, element, this.users[authorName]);
            // Disabled because of potential memory explosion
            // if (!this.users[authorName]){
            //     this.users[authorName] = msg.author;
            // }
            this.plugin.dispatchEvent('chatMessage', msg, this);
            element.__bettermixerSent = true;
        });

        this._gatherBadges = this.plugin.addEventListener('gatherBadges', event => {
            if (event.data.channel.chat !== this) {
                return;
            }

            const badges = [];
            for (const badgeElement of event.data.message!.element.querySelectorAll('[class*="badge"]')) {
                if (badgeElement instanceof HTMLImageElement) {
                    if (badgeElement.alt === 'Subscriber') {
                        if (!this.subBadge) {
                            this.subBadge = new Badge('Subscriber', badgeElement.src, badgeElement);
                        }
                        badges.push(this.subBadge);
                    }
                    else if (badgeElement.alt === 'Staff') {
                        if (!this.staffBadge) {
                            badgeElement.style.margin = "0";
                            this.staffBadge = new Badge('Staff', badgeElement.src, badgeElement);
                        }
                        badges.push(this.staffBadge);
                    }
                }
            }
            return badges;
        });

        this._emoteDialogObserver = observeNewElements('[class*="modal"] h1', document.documentElement, element => {
            if (['emotes', 'emoticons'].includes(element.innerHTML.toLowerCase())) {
                this.plugin.dispatchEvent('emotesDialogOpen', { chat: this, dialog: element.parentElement! }, this);
            }
        });

        this.plugin.dispatchEvent('chatFinishLoad', this, this);
    }

    unload() {
        this._msgObserver && this._msgObserver.disconnect();
        this._emoteDialogObserver && this._emoteDialogObserver.disconnect();
        this._gatherBadges && this.plugin.removeEventListener('gatherBadges', this._gatherBadges);
        this._loaded = false;
    }
}