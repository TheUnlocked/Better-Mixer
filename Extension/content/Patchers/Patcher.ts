import BetterMixer from "../BetterMixer.js";
import EmoteSet from "../EmoteSet.js";
import ChatMessage from "../ChatMessage.js";
import { waitFor, observeNewElements, executeInOrder } from "../Utility/Promise.js";
import { patchEmoteDialog } from "./EmoteDialogPatcher.js";
import { parseMessageEmotes } from "./EmoteDisplayPatcher.js";
import { patchSettingsDialog } from "./SettingsDialogPatcher.js";
import { loadLinkPreview } from "./LinkPreview.js";
import EmoteAutocomplete from "./EmoteAutocomplete.js";
import { EmotesAddedEvent } from "../BetterMixerEvent.js";
import { patchMessageMarkdown } from "./MarkdownPatcher.js";

export default class Patcher {
    plugin: BetterMixer;

    private _emotesAddedListener?: (event: EmotesAddedEvent) => void;
    private _renderPasses: {[renderPassType: string]: ((data: any) => void)[]} = {};

    constructor(plugin: BetterMixer) {
        this.plugin = plugin;
        this.registerRenderType('message');

        // Process markdown
        this.addRenderPass('message', message => patchMessageMarkdown(message));
        // Parse emotes
        this.addRenderPass('message', message => parseMessageEmotes(this.plugin, message));
        // Add link previews
        this.addRenderPass('message', message => {
            const links = message.element.querySelectorAll('.linkComponent') as NodeListOf<HTMLAnchorElement>;
            if (links.length > 0) {
                const mode = BetterMixer.instance.configuration.getConfig('BETA_link_preview').state;
                switch (mode) {
                    case 'off':
                        break;
                    case 'last':
                        loadLinkPreview(this.plugin, message.element, links[links.length - 1].href);
                        break;
                    case 'all':
                        executeInOrder([...links].map(link => () => loadLinkPreview(this.plugin, message.element, link.href)));
                        break;
                }
            }
        });
        // Update bot color
        this.addRenderPass('message', message => {
            const mode = BetterMixer.instance.configuration.getConfig("botcolor_mode").state;
            if (mode !== "off") {
                const regexConfig = BetterMixer.instance.configuration.getConfig("botcolor_regex");
                const regex = mode === "auto" ? regexConfig.defaultState : regexConfig.state;

                if (new RegExp(regex).test(message.author.username)) {
                    const usernameElement = message.element.querySelector('[class*="Username"]') as HTMLElement;
                    usernameElement.__bettermixerMixerColor = usernameElement.style.color;
                    usernameElement.style.color = BetterMixer.instance.configuration.getConfig("botcolor").state;
                    usernameElement.classList.add('bettermixer-role-bot');
                }
            }
        });
        // Process badges
        this.addRenderPass('message', message => {
            const badgeGatherEventData = {
                channel: message.chat.channel,
                user: message.author,
                message: message
            };
            const badges = plugin.dispatchGather('gatherBadges', badgeGatherEventData, message).flat(1);

            const authorElement = message.element.querySelector('[class*="Username"]')!;
            for (const badge of badges) {
                if (!badge.example) {
                    authorElement.appendChild(badge.element);
                }
                const preceedingBadge = badge.element as HTMLElement;
                preceedingBadge.classList.add('bettermixer-badge-relocated');
                preceedingBadge.style.display = 'none';
                authorElement.insertBefore(preceedingBadge, authorElement.firstChild);
            }
        });

        if (!this._emotesAddedListener) {
            this._emotesAddedListener = this.plugin.addEventListener('emotesAdded', event => {
                if (this.plugin.focusedChannel && this.plugin.focusedChannel.chat && this.plugin.focusedChannel.chat.element) {
                    for (const msgElement of this.plugin.focusedChannel.chat.element.querySelectorAll('div[class*="message__"]') as NodeListOf<HTMLDivElement>) {
                        parseMessageEmotes(this.plugin, new ChatMessage(this.plugin.focusedChannel!.chat!, msgElement), event.data);
                    }
                }
            });
        }

        this.plugin.addEventListener('chatMessage', event => this.performRender('message', event.data));

        // Handle emote menu
        this.plugin.addEventListener('emotesDialogOpen', event => {
            patchEmoteDialog(this.plugin, event.data.dialog, event.data.chat);
        });

        // Handle config menu
        this.plugin.addEventListener('settingsDialogOpen', event => {
            patchSettingsDialog(this.plugin, event.data.dialog);
        });

        // Handle chat load
        this.plugin.addEventListener('chatFinishLoad', event => {
            const chat = event.data;

            // Handle emote pre-loading
            {
                const emoteGatherEventData = {
                    channel: chat.channel,
                    user: chat.plugin.user!,
                    message: null
                };
                const gatheredEmotes = plugin.dispatchGather('gatherEmotes', emoteGatherEventData, chat);
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

            // Handle emote auto-complete
            {
                const autocompleter = new EmoteAutocomplete(this.plugin, chat);
                // Purge built-in autocompleter
                observeNewElements('#chat-listbox[class*="autocomplete"]', chat.element!, x => {
                    if (x.querySelector('[class*="emote"]')) {
                        x.style.display = "none";
                    }
                });
                const inputBox = chat.element!.querySelector('textarea') as HTMLTextAreaElement;

                const getQuery = () => {
                    let backIndex = inputBox.value.lastIndexOf(' ', inputBox.selectionEnd - 1);
                    let frontIndex = inputBox.value.indexOf(' ', inputBox.selectionEnd);
                    if (backIndex === -1) backIndex = 0;
                    if (frontIndex === -1) frontIndex = inputBox.value.length;
                    return inputBox.value.slice(backIndex, frontIndex + 1).trim();
                };

                inputBox.addEventListener('input', () => {
                    const query = getQuery();
                    if (query.length >= 3 || query[0] === ":") {
                        autocompleter.query = query;
                    }
                    else {
                        autocompleter.close();
                    }
                });
                
                const vanillaKeydownListener = inputBox.eventListeners()[2];
                inputBox.removeEventListener('keydown', vanillaKeydownListener);

                inputBox.addEventListener('keydown', e => {
                    if (autocompleter.showing) {
                        return autocompleter.keydownEvent(e);
                    }
                    else {
                        if (e.code === "Tab") {
                            setTimeout(() => {
                                autocompleter.query = getQuery();
                            }, 0);
                            e.preventDefault();
                            return false;
                        }
                    }
                });

                inputBox.addEventListener('keydown', vanillaKeydownListener);
            }
        });

        // Handle Browse > Filters > Save Filters
        this.plugin.addEventListener('pageLoad', () => {
            if (document.location.pathname.startsWith("/browse")) {
                this.plugin.configuration.getConfigAsync('browse_filters', async (filterConfig) => {    
                    const browseBaseUrl = "https://mixer.com" + document.location.pathname;
                    if (document.location.href === browseBaseUrl && !document.querySelector('b-browse-filters.visible') && filterConfig.state !== "") {
                        document.location.href = browseBaseUrl + "?" + filterConfig.state;
                    }

                    let filtersWindow!: HTMLElement;
                    await waitFor(() =>
                        (filtersWindow = document.querySelector('b-browse-filters') as HTMLElement) &&
                        !filtersWindow.querySelector('button.bettermixer-save-filters'));

                    const resetFiltersButton = filtersWindow.querySelector('button.reset-filters')!;
                    const saveFiltersButton = resetFiltersButton.cloneNode(true) as HTMLElement;
                    saveFiltersButton.classList.remove('reset-filters');
                    saveFiltersButton.classList.add('bettermixer-save-filters');
                    saveFiltersButton.querySelector('div > span > span')!.textContent = "Save Filters";
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

    registerRenderType<RenderPassType extends keyof RenderPassMap>(type: RenderPassType): void;
    registerRenderType(type: string) {
        if (this._renderPasses[type]) {
            this.plugin.log(`Render type ${type} has already been registered.`, BetterMixer.LogType.WARN);
        }
        else {
            this._renderPasses[type] = [];
        }
    }

    addRenderPass<RenderPassType extends keyof RenderPassMap>(type: RenderPassType, pass: (data: RenderPassMap[RenderPassType]) => void): (data: RenderPassMap[RenderPassType]) => void;
    addRenderPass(type: string, pass: (data: any) => void) {
        if (!Object.keys(this._renderPasses).includes(type)) {
            this.plugin.log(`Render type ${type} does not exist.`, BetterMixer.LogType.ERROR);
            return pass;
        }

        this._renderPasses[type].push(pass);
        return pass;
    }

    removeRenderPass<RenderPassType extends keyof RenderPassMap>(type: RenderPassType, pass: (data: RenderPassMap[RenderPassType]) => void): void;
    removeRenderPass(type: string, pass: (data: any) => void) {
        if (!Object.keys(this._renderPasses).includes(type)) {
            this.plugin.log(`Render type ${type} does not exist.`, BetterMixer.LogType.ERROR);
            return;
        }

        const index = this._renderPasses[type].indexOf(pass);
        if (index === -1) {
            this.plugin.log("That render pass does not exist!", BetterMixer.LogType.WARN);
            return;
        }

        this._renderPasses[type].splice(index, 1);
    }

    performRender<RenderPassType extends keyof RenderPassMap>(type: RenderPassType, data: RenderPassMap[RenderPassType]) {
        if (!Object.keys(this._renderPasses).includes(type)) {
            this.plugin.log(`Render type ${type} does not exist.`, BetterMixer.LogType.ERROR);
            return;
        }

        for (const pass of this._renderPasses[type]) {
            pass(data);
        }
    }

    static addTooltip(element: HTMLElement, text: string) {
        element.addEventListener('mouseover', () => {
            const tooltip = document.createElement('div');
            document.body.appendChild(tooltip); // This needs to happen first to make sure tooltip.clientWidth works correctly.

            tooltip.textContent = text;
            const rect = element.getBoundingClientRect();
            tooltip.classList.add('bettermixer-tooltip');
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.clientWidth / 2) + "px";
            tooltip.style.top = document.documentElement.scrollTop + rect.top - 24 + "px";
            tooltip.style.pointerEvents = "none";

            let scrollEvent: (event: Event) => void;
            let mouseoutEvent: (event: MouseEvent) => void;

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

interface RenderPassMap {
    message: ChatMessage;
}