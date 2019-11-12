import BetterMixer from "../BetterMixer.js";
import EmoteSet from "../EmoteSet.js";
import ChatMessage from "../ChatMessage.js";
import { waitFor } from "../Utility/Util.js";
import { patchEmoteDialog } from "./EmoteDialogPatcher.js";
import { parseMessageEmotes } from "./EmoteDisplayPatcher.js";
import { patchSettingsDialog } from "./SettingsDialogPatcher.js";

export default class Patcher {
    /**
     * 
     * @param {BetterMixer} plugin 
     */
    constructor(plugin) {
        this.plugin = plugin;

        this.plugin.addEventListener(BetterMixer.Events.ON_MESSAGE, event => {
            const message = event.sender;

            if (!this._emotesAddedListener) {
                this._emotesAddedListener = event => {
                    for (const msgElement of this.plugin.focusedChannel.chat.element.querySelectorAll('div[class*="message__"]')) {
                        parseMessageEmotes(this.plugin, new ChatMessage(this.plugin.focusedChannel.chat, msgElement), event.data);
                    }
                };
                this.plugin.addEventListener(BetterMixer.Events.ON_EMOTES_ADDED, this._emotesAddedListener);
            }

            // Handle message emotes
            {
                parseMessageEmotes(this.plugin, message);
            }

            // Handle bot color changes
            {
                const mode = BetterMixer.instance.configuration.getConfig("botcolor_mode").state;
                if (mode !== "off") {
                    const regexConfig = BetterMixer.instance.configuration.getConfig("botcolor_regex");
                    const regex = mode === "auto" ? regexConfig.defaultState : regexConfig.state;

                    if (new RegExp(regex).test(message.author.username)) {
                        const usernameElement = message.element.querySelector('[class*="Username"]');
                        usernameElement.mixerColor = usernameElement.style.color;
                        usernameElement.style.color = BetterMixer.instance.configuration.getConfig("botcolor").state;
                        usernameElement.classList.add('bettermixer-role-bot');
                    }
                }
            }

            // Handle badges
            {
                const badgeGatherEventData = {
                    channel: message.chat.channel,
                    user: message.author,
                    message: message
                };
                const badges = plugin.dispatchGather(BetterMixer.Events.GATHER_BADGES, badgeGatherEventData, message).flat(1);

                const authorElement = message.element.querySelector('[class*="Username"]');
                for (const badge of badges) {
                    if (!badge.example) {
                        authorElement.appendChild(badge.element);
                    }
                    const preceedingBadge = badge.element;
                    preceedingBadge.classList.add('bettermixer-badge-relocated');
                    preceedingBadge.style.display = 'none';
                    authorElement.insertBefore(preceedingBadge, authorElement.firstChild);
                }
            }
        });

        // Handle emote menu
        this.plugin.addEventListener(BetterMixer.Events.ON_EMOTES_DIALOG_OPEN, event => {
            patchEmoteDialog(this.plugin, event.data.dialog, event.data.chat);
        });

        // Handle config menu
        this.plugin.addEventListener(BetterMixer.Events.ON_SETTINGS_DIALOG_OPEN, event => {
            patchSettingsDialog(this.plugin, event.data.dialog);
        });

        // Handle chat load
        this.plugin.addEventListener(BetterMixer.Events.ON_CHAT_FINISH_LOAD, event => {
            // Handle emote pre-loading
            {
                const emoteGatherEventData = {
                    channel: event.sender.channel,
                    user: event.sender.plugin.user,
                    message: null
                };
                const gatheredEmotes = plugin.dispatchGather(BetterMixer.Events.GATHER_EMOTES, emoteGatherEventData, event.sender);
                for (const emotes of gatheredEmotes) {
                    if (emotes instanceof EmoteSet) {
                        for (const emote of emotes.emotes) {
                            const img = document.createElement('img');
                            img.src = emote.image;
                        }
                    }
                    else {
                        for (const emote of emotes) {
                            const img = document.createElement('img');
                            img.src = emote.image;
                        }
                    }
                }
            }
        });

        // Handle Browse > Filters > Save Filters
        this.plugin.addEventListener(BetterMixer.Events.ON_PAGE_LOAD, () => {
            if (document.location.pathname.startsWith("/browse")) {
                this.plugin.configuration.getConfigAsync('browse_filters', async (filterConfig) => {    
                    const browseBaseUrl = "https://mixer.com" + document.location.pathname;
                    if (document.location.href === browseBaseUrl && !document.querySelector('b-browse-filters.visible') && filterConfig.state !== "") {
                        document.location.href = browseBaseUrl + "?" + filterConfig.state;
                    }

                    let filtersWindow;
                    await waitFor(() =>
                        (filtersWindow = document.querySelector('b-browse-filters')) &&
                        !filtersWindow.querySelector('button.bettermixer-save-filters'));

                    const resetFiltersButton = filtersWindow.querySelector('button.reset-filters');
                    const saveFiltersButton = resetFiltersButton.cloneNode(true);
                    saveFiltersButton.classList.remove('reset-filters');
                    saveFiltersButton.classList.add('bettermixer-save-filters');
                    saveFiltersButton.querySelector('div > span > span').textContent = "Save Filters";
                    filtersWindow.insertBefore(saveFiltersButton, resetFiltersButton);

                    //Patcher.addTooltip(saveFiltersButton, 'The "Games" and "Share Controller" filters are currently not supported.');

                    saveFiltersButton.addEventListener('click', () => {
                        if (window.location.href.includes('?'))
                            filterConfig.state = window.location.href.split('?')[1];
                        else
                            filterConfig.state = "";
                        this.plugin.configuration.saveConfig();
                    });
                });
            }
        });

        this.plugin.log("Patcher Loaded");
    }

    /**
     * 
     * @param {Element} element 
     * @param {String} text 
     */
    static addTooltip(element, text) {
        element.addEventListener('mouseover', () => {
            const tooltip = document.createElement('div');
            document.body.appendChild(tooltip); // This needs to happen first to make sure tooltip.clientWidth works correctly.

            tooltip.textContent = text;
            const rect = element.getBoundingClientRect();
            tooltip.classList.add('bettermixer-tooltip');
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.clientWidth / 2) + "px";
            tooltip.style.top = document.documentElement.scrollTop + rect.top - 24 + "px";
            tooltip.style.pointerEvents = "none";

            let scrollEvent, mouseoutEvent;

            window.addEventListener('scroll',
                scrollEvent = () => tooltip.style.top = document.documentElement.scrollTop + rect.top - 24 + "px");

            element.addEventListener('mouseout', mouseoutEvent = () => {
                document.body.removeChild(tooltip);
                element.removeEventListener('mouseout', mouseoutEvent);
                window.removeEventListener('scroll', scrollEvent);
            });
        });
    }
}