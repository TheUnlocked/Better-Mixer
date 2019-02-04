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

                let textPieces = [...message.element.getElementsByClassName('textComponent__Efj4_')];
                for (let textElement of textPieces) {
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
                            if (!textBuilder && messageBuilder.length != 0){
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
                    let usernameElement = message.element.querySelector('.Username__1i7gh');
                    usernameElement.style.color = BetterMixer.instance.configuration.getConfig("botcolor").state;
                    usernameElement.classList.add('bettermixer-role-bot');

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

                let authorElement = message.element.querySelector('.Username__1i7gh');
                for (let badge of badges){
                    if (!badge.example){
                        authorElement.appendChild(badge.element);
                    }
                    let preceedingBadge = badge.element;
                    preceedingBadge.classList.add('bettermixer-badge-relocated');
                    preceedingBadge.style.display = 'none';
                    authorElement.insertBefore(preceedingBadge, authorElement.firstChild);
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

            let emoteContainer = event.data.dialog.querySelector('div.container__3unoh');
            emoteContainer.style.overflow = "hidden";
            
            let exampleButton = emoteContainer.children[0];

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
                for (let emote of emoteSet.emotes){
                    let emoteButton = exampleButton.cloneNode();
                    emoteButton.appendChild(emote.element);
                    emoteButton.style.width = emote.width + 12 + "px";
                    emoteButton.addEventListener('click', () => {
                        // let doc = document.getElementsByClassName('CodeMirror')[0].CodeMirror.getDoc();
                        // let cursor = doc.getCursor();

                        // let insertText = (doc.getLine(cursor.line)[cursor.ch - 1] == ' ' ? '' : ' ') +
                        //                 emote.name +
                        //                 (doc.getLine(cursor.line)[cursor.ch] == ' ' ? '' : ' ');
                        // doc.replaceSelection(insertText);

                        let inputBox = event.sender.element.querySelector('textarea');
                        inputBox.value += `${inputBox.value.length == 0 || inputBox.value.endsWith(' ') ? '' : ' '}${emote.name} `;
                    });
                    emoteContainer.insertBefore(emoteButton, exampleButton);
                }
            }
        });

        // Handle config menu
        this.plugin.addEventListener(BetterMixer.Events.ON_SETTINGS_DIALOG_OPEN, event => {
            let disconnected = false;

            let waitForLoadObserver = $.initialize('h2.title__o03-e', () => {
                if (disconnected) return;

                waitForLoadObserver.disconnect();
                disconnected = true;

                let configSection = event.data.dialog.querySelector('section');

                let label = document.createElement('h2');
                label.classList.add('title__o03-e');
                label.innerHTML = "Better Mixer Preferences";
                configSection.appendChild(label);

                let exampleToggle = configSection.querySelector('.control_cB-GA.toggle_jWBwj');
                let exampleColor = configSection.querySelector('.wrapper_msbKC .currentColor_1t7wS').parentElement.parentElement;

                let configsData = [];

                for (let config of plugin.configuration.getAllConfigs()){
                    let configElement;
                    switch(config.configType){
                        case Config.ConfigTypeEnum.BOOLEAN:
                            configElement = exampleToggle.cloneNode(true);
                            configElement.children[2].innerHTML = config.displayText;

                            if (config.state != configElement.classList.contains('checked_2YALu')){
                                configElement.classList.toggle('checked_2YALu');
                            }
                            configElement.getElementsByTagName("input")[0].addEventListener('click', e => {
                                configElement.classList.toggle('checked_2YALu');
                                configElement.tempState = configElement.classList.contains('checked_2YALu');
                            });
                            break;
                        case Config.ConfigTypeEnum.COLOR:
                            configElement = exampleColor.cloneNode(true);
                            configElement.children[0].innerHTML = config.displayText;
                            configElement.appendChild(configElement.children[0]);

                            let colorIndicator = configElement.getElementsByClassName('currentColor_1t7wS')[0];
                            colorIndicator.style.backgroundColor = config.state;
                            let valueInput = configElement.getElementsByTagName('input')[0];
                            valueInput.value = config.state;
                            
                            valueInput.addEventListener('input', e => {
                                const colorLengths = [3, 4, 6, 8];
                                if (valueInput.value.match(/^#[a-fA-F0-9]*$/) && colorLengths.includes(valueInput.value.length - 1)){
                                    configElement.classList.remove('bettermixer-color-config-invalid');
                                    configElement.tempState = valueInput.value;
                                    colorIndicator.style.backgroundColor = valueInput.value;
                                }
                                else{
                                    configElement.classList.add('bettermixer-color-config-invalid');
                                    configElement.tempState = undefined;
                                }
                            });
                            break;
                        case Config.ConfigTypeEnum.NONE:
                            break;
                    }
                    if (configElement){
                        configSection.appendChild(configElement);
                        configsData.push({
                            element: configElement,
                            config: config
                        });
                    }
                }

                // Reset to defaults
                // configSection.lastChild.addEventListener('click', e => {
                //     for (let configData of configsData){
                //         let element = configData.element;
                //         let config = configData.config;
                //         switch(config.configType){
                //             case Config.ConfigTypeEnum.BOOLEAN:
                //                 if (config.defaultState != element.classList.contains('checked_2YALu')){
                //                     element.tempState = config.defaultState;
                //                     element.classList.toggle('checked_2YALu');
                //                 }
                //                 break;
                //             case Config.ConfigTypeEnum.NONE:
                //                 break;
                //         }
                //     }
                // });

                // Save
                event.data.dialog.querySelector('button[data-variant="primary"]').addEventListener('click', e => {
                    for (let configData of configsData){
                        if (configData.element.tempState !== undefined){
                            configData.config.state = configData.element.tempState;
                        }
                    }
                    this.plugin.configuration.saveConfig();
                    this.plugin.configuration.updateConfig();
                    this.plugin.log("Updated configurations.");
                });
            }, { target: event.data.dialog });
        });

        // Handle Browse > Filters > Save Filters
        this.plugin.addEventListener(BetterMixer.Events.ON_PAGE_LOAD, () => {
            let filterConfig = this.plugin.configuration.getConfigAsync('browse_filters', (filterConfig) => {
                if (document.location.pathname.startsWith("/browse")){
                    let browseBaseUrl = "https://mixer.com" + document.location.pathname;
                    if (document.location.href == browseBaseUrl && !document.querySelector('b-browse-filters.visible') && filterConfig.state != ""){
                        document.location.href = browseBaseUrl + "?" + filterConfig.state;
                    }

                    let checkFiltersLoaded = () => {
                        let filtersWindow = document.querySelector('b-browse-filters');
                        if (filtersWindow && !filtersWindow.querySelector('button.bettermixer-save-filters')){
                            let resetFiltersButton = filtersWindow.querySelector('button.reset-filters');
                            let saveFiltersButton = resetFiltersButton.cloneNode(true);
                            saveFiltersButton.classList.remove('reset-filters');
                            saveFiltersButton.classList.add('bettermixer-save-filters');
                            saveFiltersButton.querySelector('div > span > span').innerText = "Save Filters";
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