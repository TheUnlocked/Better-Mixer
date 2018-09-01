import BetterMixer from "./BetterMixer.js";
import Config from "./Configs/Config.js";
import EmoteSet from "./EmoteSet.js";

export default class Patcher{
    /**
     * 
     * @param {BetterMixer} plugin 
     */
    constructor(plugin){

        this.plugin = plugin;

        this.plugin.addEventListener(BetterMixer.Events.ON_MESSAGE, event => {
            let message = event.sender;

            // Alternating lines (will be done with pure CSS once :nth-child(An+B of S) comes out into chrome stable)
            {
                let parent = message.element.parentElement;
                if (!parent.previousSibling.classList || parent.previousSibling.classList.contains("timestamp")){
                    parent.betterMixerAltLineColor = !parent.previousSibling.previousSibling.betterMixerAltLineColor;
                } 
                else{
                    parent.betterMixerAltLineColor = !parent.previousSibling.betterMixerAltLineColor;
                }
            
                if (parent.betterMixerAltLineColor){
                    parent.classList.add("bettermixer-alternate-chat-line-color");
                }
            }

            // Handle message emotes
            {
                let emoteGatherEventData = {
                    channel: message.chat.channel,
                    user: message.author,
                    message: message
                };
                let emoteList = plugin.dispatchGather(BetterMixer.Events.GATHER_EMOTES, emoteGatherEventData, message)
                    .reduce((acc, val) => val.constructor === EmoteSet ? acc.concat(val.emotes) : acc.concat(val), []);
                let emotes = emoteList.reduce((result, value, index, arr) => { result[value.name] = value; return result; }, {});

                for (let textElement of message.element.getElementsByClassName('textComponent')) {
                    // Break it up into text pieces, and check each piece for an emote
                    let words = textElement.innerHTML.trim().split(" ");
                    let messageBuilder = [];

                    // Buffer used to retain non-emote text
                    let textBuilder = "";
                    for (let word of words) {
                        let emote = emotes[word];
                        if (emote) {
                            // End the text element if you find an emote
                            if (textBuilder) {
                                let newText = textElement.cloneNode();
                                newText.innerHTML = textBuilder;
                                messageBuilder.push(newText);
                                textBuilder = "";
                            }
                            // Push the emote
                            messageBuilder.push(emote.element);
                        } else {
                            if (!textBuilder){
                                textBuilder = ' ';
                            }
                            textBuilder += `${word} `;
                        }
                    }
                    // Finish the text buffer, if one exists
                    if (textBuilder) {
                        let newText = textElement.cloneNode();
                        newText.innerHTML = textBuilder;
                        messageBuilder.push(newText);
                    }
                    // Replace the text element with the new text/emote elements
                    for (let word of messageBuilder){
                        textElement.parentElement.insertBefore(word, textElement);
                        //textElement.parentElement.insertBefore(document.createTextNode(' '), textElement);
                    }
                    textElement.parentElement.removeChild(textElement);
                }
            }

            // Handle bot color changes
            {
                if (message.author.username.includes("Bot") || message.author.username.toLowerCase().endsWith("bot")){
                    message.element.getElementsByTagName("b-channel-chat-author")[0].classList.add('bettermixer-role-bot');
                }
            }

            // Handle badges
            {
                let badgeGatherEventData = {
                    channel: message.chat.channel,
                    user: message.author,
                    message: message
                };
                let badges = plugin.dispatchGather(BetterMixer.Events.GATHER_BADGES, badgeGatherEventData, message)
                    .reduce((acc, val) => acc.concat(val), []); // Upgrade to .flat(1) when that becomes mainstream tech

                let authorElement = message.element.getElementsByTagName('b-channel-chat-author')[0];
                for (let badge of badges){
                    if (!badge.example){
                        authorElement.appendChild(badge.element);
                    }
                    let preceedingBadge = badge.element;
                    preceedingBadge.classList.add('bettermixer-badge-relocated');
                    preceedingBadge.style.display = 'none';
                    authorElement.insertBefore(preceedingBadge, authorElement.getElementsByClassName('username')[0]);
                }
            }
        });

        // Handle emote menu
        this.plugin.addEventListener(BetterMixer.Events.ON_EMOTES_DIALOG_OPEN, event => {
            let emoteGatherEventData = {
                channel: event.sender.channel,
                user: event.sender.plugin.user,
                message: null
            };
            let gatheredEmotes = plugin.dispatchGather(BetterMixer.Events.GATHER_EMOTES, emoteGatherEventData, event.sender);

            let dialog = event.data.dialog.getElementsByTagName("bui-dialog-content")[0];
            dialog.style.overflow = "hidden";
            
            let exampleEmoteSet = dialog.children[0];
            let exampleTile = exampleEmoteSet.children[0];

            let emoteSets = [];
            let uncategorizedEmotes = new EmoteSet("Uncategorized");

            for (let emotes of gatheredEmotes){
                if (emotes.constructor === EmoteSet){
                    emoteSets.push(emotes);
                }
                else{
                    uncategorizedEmotes.addEmotes(emotes);
                }
            }

            emoteSets.push(uncategorizedEmotes);

            for (let emoteSet of emoteSets){
                if (Object.keys(emoteSet.emotes).length !== 0){
                    let emoteTileSet = exampleEmoteSet.cloneNode();
                    emoteTileSet.classList.add('bettermixer-emote-tiles');

                    let title = document.createElement('div');
                    title.innerHTML = emoteSet.name;
                    title.classList.add('display-1', 'bettermixer-dialog-subtitle');
                    emoteTileSet.appendChild(title);

                    dialog.appendChild(emoteTileSet);

                    for (let emote of emoteSet.emotes){
                        let emoteTile = exampleTile.cloneNode();
                        emoteTile.appendChild(emote.element);
                        emoteTile.style.width = emote.width + 12 + "px";
                        emoteTile.addEventListener('click', () => {
                            let doc = document.getElementsByClassName('CodeMirror')[0].CodeMirror.getDoc();
                            let cursor = doc.getCursor();

                            let insertText = (doc.getLine(cursor.line)[cursor.ch - 1] == ' ' ? '' : ' ') +
                                            emote.name +
                                            (doc.getLine(cursor.line)[cursor.ch] == ' ' ? '' : ' ');
                            doc.replaceSelection(insertText);
                        });
                        emoteTileSet.appendChild(emoteTile);
                    }
                }
            }

            let mixerEmoteSetTitle = document.createElement('div');
            mixerEmoteSetTitle.innerHTML = "Mixer Emotes";
            mixerEmoteSetTitle.classList.add('display-1', 'bettermixer-dialog-subtitle');
            exampleEmoteSet.insertBefore(mixerEmoteSetTitle, exampleEmoteSet.children[0]);

            dialog.appendChild(exampleEmoteSet);
        });

        // Handle config menu
        this.plugin.addEventListener(BetterMixer.Events.ON_SETTINGS_DIALOG_OPEN, event => {
            let panel = event.data.dialog.getElementsByTagName("bui-dialog-content")[0];
            let exampleSection = panel.children[0];
            let betterMixerSection = exampleSection.cloneNode();
            betterMixerSection.style.marginTop = "24px";

            let label = exampleSection.children[0].cloneNode();
            label.innerHTML = "Better Mixer Preferences";
            betterMixerSection.appendChild(label);

            for (let config of plugin.configuration.getAllConfigs()){
                let configElement;
                switch(config.configType){
                    case Config.ConfigTypeEnum.BOOLEAN:
                        configElement = exampleSection.getElementsByTagName('bui-toggle')[0].cloneNode(true);
                        configElement.children[0].children[2].innerHTML = config.displayText;

                        if (config.state != configElement.classList.contains('bui-toggle-checked')){
                            configElement.classList.toggle('bui-toggle-checked');
                        }

                        configElement.getElementsByTagName("input")[0].addEventListener('click', e => {
                            configElement.classList.toggle('bui-toggle-checked');
                            config.state = configElement.classList.contains('bui-toggle-checked');
                        });
                        break;
                }
                betterMixerSection.appendChild(configElement);
            }
            panel.appendChild(betterMixerSection);

            event.data.dialog.querySelector('button[variant="primary"]').addEventListener('click', e => {
                this.plugin.configuration.saveConfig();
                this.plugin.configuration.updateConfig();
                this.plugin.log("Updated configurations.");
            });
        });

        // Handle Browse > Filters > Save Filters
        this.plugin.addEventListener(BetterMixer.Events.ON_PAGE_LOAD, () => {
            let filterConfig = this.plugin.configuration.getConfigAsync('browse_filters', (filterConfig) => {
                if (document.location.href.startsWith("https://mixer.com/browse/all")){
                    if (document.location.href == "https://mixer.com/browse/all" && !document.querySelector('b-browse-filters.visible') && filterConfig.state != ""){
                        document.location.href = "https://mixer.com/browse/all?" + filterConfig.state;
                    }

                    let checkFiltersLoaded = () => {
                        let filtersWindow = document.querySelector('b-browse-filters');
                        if (filtersWindow && !filtersWindow.querySelector('button.bettermixer-save-filters')){
                            let resetFiltersButton = filtersWindow.querySelector('button.reset-filters');
                            let saveFiltersButton = resetFiltersButton.cloneNode(true);
                            saveFiltersButton.classList.remove('reset-filters');
                            saveFiltersButton.classList.add('bettermixer-save-filters');
                            saveFiltersButton.firstChild.firstChild.firstChild.innerText = "Save Filters";
                            filtersWindow.insertBefore(saveFiltersButton, resetFiltersButton);

                            //Patcher.addTooltip(saveFiltersButton, 'The "Games" and "Share Controller" filters are currently not supported.');

                            saveFiltersButton.addEventListener('click', e => {
                                if (window.location.href.includes('?'))
                                    filterConfig.state = window.location.href.split('?')[1];
                                else
                                    filterConfig.state = "";
                                this.plugin.configuration.saveConfig();
                            });
                        }
                        else setTimeout(checkFiltersLoaded, 100);
                    };
                    checkFiltersLoaded();
                }
            });
        });
    }

    /**
     * 
     * @param {Element} element 
     * @param {String} text 
     */
    static addTooltip(element, text){
        element.addEventListener('mouseover', () => {
            let tooltip = document.createElement('div');
            document.body.appendChild(tooltip); // This needs to happen first to make sure tooltip.clientWidth works correctly.

            tooltip.innerHTML = text;
            let rect = element.getBoundingClientRect();
            tooltip.classList.add('bettermixer-tooltip');
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.clientWidth / 2) + "px";
            tooltip.style.top = document.documentElement.scrollTop + rect.top - 24 + "px";
            tooltip.style.pointerEvents = "none";

            let scrollEvent = () => tooltip.style.top = document.documentElement.scrollTop + rect.top - 24 + "px";
            window.addEventListener('scroll', scrollEvent);

            element.addEventListener('mouseout', function mouseoutEvent() {
                document.body.removeChild(tooltip);
                element.removeEventListener('mouseout', mouseoutEvent);
                window.removeEventListener('scroll', scrollEvent);
            });
        });
    }
}