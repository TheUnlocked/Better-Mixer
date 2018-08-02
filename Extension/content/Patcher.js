import BetterMixer from "./BetterMixer.js";

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
                    .reduce((acc, val) => acc.concat(val), []); // Upgrade to .flat(1) when that becomes mainstream tech
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
                    if (badge.vanillaSelector){
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
            let emoteSets = plugin.dispatchGather(BetterMixer.Events.GATHER_EMOTES, emoteGatherEventData, event.sender);

            let examplePanel = event.data.dialog.getElementsByTagName("bui-dialog-content")[0];
            let exampleTile = examplePanel.children[0].children[0];

            for (let emoteSet of emoteSets){
                if (Object.keys(emoteSet).length !== 0){
                    let emotePanel = examplePanel.children[0].cloneNode();
                    examplePanel.insertBefore(emotePanel, examplePanel.children[0]);
                    examplePanel.style.overflow = "hidden";
                    for (let emote of emoteSet){
                        let emoteTile = exampleTile.cloneNode();
                        emoteTile.appendChild(emote.element);
                        emoteTile.addEventListener('click', () => {
                            let doc = document.getElementsByClassName('CodeMirror')[0].CodeMirror.getDoc();
                            let cursor = doc.getCursor();

                            let insertText = (doc.getLine(cursor.line)[cursor.ch - 1] == ' ' ? '' : ' ') +
                                            emote.name +
                                            (doc.getLine(cursor.line)[cursor.ch] == ' ' ? '' : ' ');
                            doc.replaceSelection(insertText);
                        });
                        emotePanel.appendChild(emoteTile);
                    }
                    emotePanel.appendChild(document.createElement('hr'));
                }
            }
        });
    }
}