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
                <span class="bettermixer-emote-tooltip">${alt}</span>
            </div>`;
}

function getMixerUsername() {
    return new Promise(function (resolve, reject) {
        // Get username or user ID
        let usernameOrID = window.location.pathname.substring(1).toLowerCase(); // Sadly this won't work for co-streams.
        // If the retrieved identifier is the user ID, get their username.
        let userID = parseInt(usernameOrID);
        if (userID) {
            $.getJSON(`https://mixer.com/api/v1/channels/${userID}/details`, function (data) {
                resolve(data.token);
                return;
            });
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
            
            if (!userSync[username])
                userSync[username.toLowerCase()] = userSync[username];
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

// import "emotes.css";
css = `

.bettermixer-emotes .bettermixer-emote-tooltip {
	visibility: hidden;
    width: 120px;
    background-color: rgb(32, 32, 32);
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 5px 0;
    position: absolute;
    z-index: 99;
    bottom: 100%;
    left: 50%;
    margin-left: -60px;
}

.bettermixer-emotes .bettermixer-emote-tooltip::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: rgb(32, 32, 32) transparent transparent transparent;
}

.bettermixer-emotes:hover .bettermixer-emote-tooltip {
    visibility: visible;
    position:absolute;
    animation-name: bettermixer-tooltip-anim;
    animation-duration: 0.15s;
    animation-timing-function: ease-out;
}

@keyframes bettermixer-tooltip-anim{
	from {bottom: 0%; transform: scale(0); opacity: 0%; visibility: hidden;}
    to {bottom: 100%;  transform: scale(1); opacity: 100%; visibility: visible;}
}

.bettermixer-emotes {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: -6px 2px 0;
    top: 5px;
}
`;

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

    injectCss(css);

    let botColor = '#ff8f20';
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

            let emoteBoxObserver = new MutationObserver(function (mutations) {
                if (Object.keys(customEmotes).length !== 0){
                    for (let mutation of mutations) {
                        if (mutation.addedNodes.length == 1) {
                            for (let emotePanel of mutation.addedNodes[0].getElementsByTagName("bui-dialog-content")){
                                let customTiles = emotePanel.children[0].cloneNode();
                                let tile = emotePanel.children[0].children[0];
                                emotePanel.insertBefore(customTiles, emotePanel.children[0]);
                                for (let emoteName of Object.keys(customEmotes)){
                                    let emote = customEmotes[emoteName];
                                    let emoteTile = tile.cloneNode();
                                    emoteTile.innerHTML = emoteLiteral(emote[0], emoteName, emote[1]);
                                    emoteTile.addEventListener('click', () => document
                                                                            .getElementById('better-mixer-injection-script')
                                                                            .dispatchEvent(new CustomEvent('addToChat', {detail:emoteName + " "})));
                                    customTiles.appendChild(emoteTile);
                                }
                                customTiles.appendChild(document.createElement('hr'));
                            }
                        }
                    }
                }
            });

            // Execute the observer
            messageObserver.observe(document.getElementsByClassName("message-container")[0], {
                "childList": true
            });
            
            emoteBoxObserver.observe(document.getElementsByTagName("b-channel-chat")[0], {
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
        }
    }
}
function patchMessageBotColor(message){
    if (message.getElementsByClassName("username")[0].innerText.toLowerCase().includes("bot")){
        message.getElementsByTagName("b-channel-chat-author")[0].classList.add('bettermixer-bots');
    }
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