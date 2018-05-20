// COPYRIGHT © 2018 Unlocked
// "The extension" refers to the "MoreMixer" or "More Mixer" browser extension
// "This code" refers to the code in this document, or any other code in the extension.
// You may modify and redistribute this code or the extension for private use, as long as credit is given.
// If you wish to redistribute or modify this code or the extension for large-scale use, written permission must be obtained.
// Any attempt to intentionally subvert these rules may result in a complete ban from redistributing and/or modifying this code or any part of the extension.

// Initializer observer, to be used once.
let extinit;

let customEmotes = {};

function textLiteral(text) {
    return `<span class="textComponent">${text}</span>`;
}

function emoteLiteral(img, alt, size) {
    return `<div class="graphic bettermixer-emotes" style="height: ${size}px; width: ${size}px;">
                <img src="${img}" alt="${alt}" title="${alt}" />
            </div>`;
}

function getMixerUsername() {
    return new Promise(function (resolve, reject) {
        // Get username or user ID
        let usernameOrID = window.location.pathname.split('/').pop().toLowerCase(); // Sadly this won't work for co-streams.
        // If the retrieved identifier is the user ID, get their username.
        let userID = parseInt(usernameOrID);
        if (userID) {
            $.getJSON(`https://mixer.com/api/v1/channels/${userID}/details`, function (data) {
                console.log(data);
                resolve(data.token.toLowerCase());
            });
            return;
        }
        resolve(usernameOrID);
    });
}

function addUserEmotes(username) {
    return new Promise(function (resolve, reject) {
        $.getJSON("https://raw.githubusercontent.com/TheUnlocked/Better-Mixer/master/Info/ffzsync.json", function (userSync) {
            // Backpatching
            for (let key of Object.keys(userSync)){
                userSync[key.toLowerCase()] = userSync[key];
            }
            
            console.log(username);
            $.getJSON(`https://api.frankerfacez.com/v1/room/${userSync[username]}`, function (data) {
                let userEmotes = {};
                for (let emoteSet in data.sets) {
                    for (let emote of data.sets[emoteSet].emoticons) {
                        userEmotes[emote.name] = [emote.urls["1"], emote.height];
                    }
                }
                Object.assign(customEmotes, userEmotes);
                console.log(`Added emotes for ${username}`);
            });
        }).always((_, __) => resolve());
    });
}

function resetEmotes() {
    customEmotes = {
//        "TestEmote": ["https://i.imgur.com/Fm8qROA.png", 28]
    };
}

function addClass(name, def) {
    injectCss(`.${name}{${def}}`);
    return def;
}

function injectCss(css){
    let styleEmotes = document.createElement('style');
    styleEmotes.type = 'text/css';
    styleEmotes.innerHTML = css;
    document.getElementsByTagName('head')[0].appendChild(styleEmotes);
}

let messageObserver;

function ext() {
    if (messageObserver) {
        messageObserver.disconnect();
    }

    resetEmotes();

    injectCss(chrome.extension.getURL('lib/inject.css'));

    let botColor = '#ba5c00';
    let botsStyleAvatar = addClass('bettermixer-bots .image', `background-color: ${botColor} !important;`);
    let botsStyleUsername = addClass('bettermixer-bots .username', `color: ${botColor} !important;`);

    getMixerUsername()
        .then(addUserEmotes)
        .then(function () {
            // Search for new chat messages
            messageObserver = new MutationObserver(function (mutations) {
                for (let mutation of mutations) {
                    if (mutation.addedNodes.length == 1) {
                        let addedElement = mutation.addedNodes[0];
                        for (let addedMsg of addedElement.getElementsByTagName("b-channel-chat-message")) {
                            for (let patch of messagePatches){
                                patch(addedMsg);
                            }
                        }
                    }
                }
            });

            let dialogObserver = new MutationObserver(function (mutations) {
                if (Object.keys(customEmotes).length !== 0){
                    for (let mutation of mutations) {
                        if (mutation.addedNodes.length == 1) {
                            for (let addedNode of mutation.addedNodes){
                                switch (addedNode.tagName){
                                    case "B-CHANNEL-CHAT-EMOTE-DIALOG":
                                        let emotePanel = addedNode.getElementsByTagName("bui-dialog-content")[0];
                                        let customTiles = emotePanel.children[0].cloneNode();
                                        let tile = emotePanel.children[0].children[0];
                                        emotePanel.insertBefore(customTiles, emotePanel.children[0]);
                                        emotePanel.style.overflow = "hidden";
                                        for (let emoteName of Object.keys(customEmotes)){
                                            let emote = customEmotes[emoteName];
                                            let emoteTile = tile.cloneNode();
                                            emoteTile.innerHTML = emoteLiteral(emote[0], emoteName, emote[1]);
                                            makeEmoteTooltip(emoteTile, emoteName);
                                            emoteTile.addEventListener('click', () => document
                                                                                    .getElementById('better-mixer-injection-script')
                                                                                    .dispatchEvent(new CustomEvent('addToChat', {detail:emoteName + " "})));
                                            customTiles.appendChild(emoteTile);
                                        }
                                        customTiles.appendChild(document.createElement('hr'));
                                        break;
                                    
                                    case "B-CHANNEL-CHAT-PREFERENCES-DIALOG":
                                        let preferencesPanel = addedNode.getElementsByTagName("bui-dialog-content")[0];
                                        let personal = preferencesPanel.children[1];
                                        break;

                                    default:
                                        break;
 
                                }
                            }
                        }
                    }
                }
            });

            // Execute the observer
            messageObserver.observe(document.getElementsByClassName("message-container")[0], {
                "childList": true
            });
            
            dialogObserver.observe(document.getElementsByTagName("b-channel-chat")[0], {
                "childList": true
            });
        });
    
    let injectionScript = document.createElement('script');
    injectionScript.id = 'better-mixer-injection-script';
    injectionScript.innerHTML = `
    function addToChat(text) {
        let codeMirrorDoc = document.getElementsByClassName('CodeMirror')[0].CodeMirror.getDoc();
        let preparedNew = codeMirrorDoc.getValue();
        if (preparedNew != '' && !preparedNew.endsWith(' '))
            preparedNew += ' ';
        codeMirrorDoc.setValue(\`\${preparedNew}\${text}\`);
    }
    document.getElementById('better-mixer-injection-script').addEventListener('addToChat', (event) => addToChat(event.detail));`;
    document.head.appendChild(injectionScript);
    
}

let messagePatches = [patchMessageEmotes, patchMessageBotColor];

function patchMessageEmotes(message){
    for (let msgText of message.getElementsByClassName("textComponent")) {
        if (msgText) {
            // Break it up into text pieces, and check each piece for an emote
            let segmented = msgText.innerHTML.trim().split(" ");
            let segmentedNew = [];
            // Buffer used to retain non-emote text
            let textBuffer = "";
            for (let segment of segmented) {
                let emote = customEmotes[segment];
                if (emote) {
                    // End the text element if you find an emote
                    if (textBuffer) {
                        segmentedNew.push(textLiteral(textBuffer));
                        textBuffer = "";
                    }
                    // Push the emote
                    segmentedNew.push(emoteLiteral(emote[0], segment, emote[1]));
                } else {
                    textBuffer += ` ${segment}`;
                }
            }
            // Finish the text buffer, if one exists
            if (textBuffer) {
                segmentedNew.push(textLiteral(textBuffer));
            }
            // Replace the text element with the new text/emote elements
            $(msgText).replaceWith(segmentedNew.join(" "));
            
            for (let emote of message.querySelectorAll('.graphic.bettermixer-emotes > img')){
                makeEmoteTooltip(emote, emote.alt);
            }
        }
    }
}
function patchMessageBotColor(message){
    let username = message.getElementsByClassName("username")[0].innerText;
    if (username.includes("Bot") || username.toLowerCase().endsWith("bot")){
        message.getElementsByTagName("b-channel-chat-author")[0].classList.add('bettermixer-bots');
    }
}

function makeEmoteTooltip(emoteElement, emoteName){
    emoteElement.addEventListener('mouseover', function() {
        let tooltip = document.createElement('div');
        document.body.appendChild(tooltip);
        tooltip.innerHTML = emoteName;
        let rect = emoteElement.getBoundingClientRect();
        tooltip.classList.add('bettermixer-emote-tooltip');
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.clientWidth / 2) + "px";
        tooltip.style.top = rect.top - 24 + "px";
        tooltip.style.pointerEvents = "none";
        function mouseoutEvent() {
            document.body.removeChild(tooltip);
            emoteElement.removeEventListener('mouseout', mouseoutEvent);
        }
        emoteElement.addEventListener('mouseout', mouseoutEvent);
    });
}

// Initiate script
let observing = false;

$(function () {
    extinit = new MutationObserver(function (mutations) {
        let exists = document.getElementsByClassName("message-container").length == 1;
        if (!observing && exists) {
            observing = true;
            ext();
        } else if (observing && !exists) {
            observing = false;
        }
    });
    extinit.observe(document, {
        "childList": true,
        "subtree": true
    }); // We aren't going to destroy this because of soft page transitions
});