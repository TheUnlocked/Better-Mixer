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

function getBetterMixerConfig() {
    let config_defaults = {
        'botcolor_enabled':     true,
        'hide_avatars':         false,
    };

    return new Promise(function (resolve, reject) {
        chrome.storage.sync.get(Object.keys(config_defaults), (data) => {
            for (let config in config_defaults){
                if (data[config] === undefined){
                    data[config] = config_defaults[config];
                    chrome.storage.sync.set({config: data[config]});
                }
            }
            resolve(data);
        });
    });
}

function resetEmotes() {
    customEmotes = {};
}

function injectFile(rel, url, loc=document.getElementsByTagName('head')[0]){
    let injection = document.createElement('link');
    injection.rel = rel;
    injection.href = url;
    loc.appendChild(injection);
    return injection;
}

function injectFileExtension(rel, url, loc=document.getElementsByTagName('head')[0]){
    return new Promise((resolve, reject) =>
        chrome.runtime.sendMessage({request: "geturl", data: url}, function (response) {
            let injection = document.createElement('link');
            injection.rel = rel;
            injection.href = response;
            loc.appendChild(injection);
            resolve(injection);
    }));
}

function toggleAttribute(element, attribute){
    if (!element["__togglemem_" + attribute]){
        element["__togglemem_" + attribute] = element[attribute];
    }
    if (element[attribute]){
        element["__togglemem_" + attribute] = element[attribute];
        element.removeAttribute(attribute);
    }
    else{
        element[attribute] = element["__togglemem_" + attribute];
    }
}

let messageObserver;

function ext() {
    if (messageObserver) {
        messageObserver.disconnect();
    }

    resetEmotes();

    let cssInjection;
    let botColorInjection;
    let hideAvatarInjection;

    injectFileExtension('stylesheet', 'lib/inject.css')
        .then((result) => new Promise((resolve, reject) => { cssInjection = result; resolve(); }))
        .then(() => injectFileExtension('stylesheet', 'lib/botcolor.css'))
        .then((result) => new Promise((resolve, reject) => { botColorInjection = result; resolve(); }))
        .then(() => injectFileExtension('stylesheet', 'lib/hideavatars.css'))
        .then((result) => new Promise((resolve, reject) => { hideAvatarInjection = result; resolve(); }))
        .then(getMixerUsername)
        .then(addUserEmotes)
        .then(getBetterMixerConfig)
        .then(function (config) {
            if (!config.botcolor_enabled){
                toggleAttribute(botColorInjection, 'href');
            }
            if (!config.hide_avatars){
                toggleAttribute(hideAvatarInjection, 'href');
            }

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

            // Observe when new dialogs are opened
            let dialogObserver = new MutationObserver(function (mutations) {
                for (let mutation of mutations) {
                    if (mutation.addedNodes.length == 1) {
                        for (let addedNode of mutation.addedNodes){
                            switch (addedNode.tagName){
                                case "B-CHANNEL-CHAT-EMOTE-DIALOG":
                                    if (Object.keys(customEmotes).length !== 0){
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
                                    }
                                    break;
                                case "B-CHANNEL-CHAT-PREFERENCES-DIALOG":
                                    let preferencesPanel = addedNode.getElementsByTagName("bui-dialog-content")[0];
                                    let sampleSection = preferencesPanel.children[0];
                                    let customSection = sampleSection.cloneNode();
                                    customSection.style.marginTop = "24px";

                                    let customLabel = sampleSection.children[0].cloneNode();
                                    customLabel.innerHTML = "Better Mixer Preferences";
                                    customSection.appendChild(customLabel);

                                    let toggleList = [
                                        ['botcolor_enabled',    "Change Bot Colors",    botColorInjection],
                                        ['hide_avatars',        "Hide Avatars",         hideAvatarInjection]
                                    ];
                                    for (let toggleData of toggleList){
                                        let toggleSwitch = sampleSection.getElementsByTagName('bui-toggle')[0].cloneNode(true);
                                        toggleSwitch.children[0].children[2].innerHTML = toggleData[1];
                                        if (config[toggleData[0]]){
                                            if (!toggleSwitch.classList.contains('bui-toggle-checked')){
                                                toggleSwitch.classList.add('bui-toggle-checked');
                                            }
                                        }
                                        else{
                                            if (toggleSwitch.classList.contains('bui-toggle-checked')){
                                                toggleSwitch.classList.remove('bui-toggle-checked');
                                            }
                                        }

                                        toggleSwitch.getElementsByTagName("input")[0].addEventListener('click', (e) => {
                                            toggleSwitch.classList.toggle('bui-toggle-checked');
                                            toggleAttribute(toggleData[2], 'href');
                                            config[toggleData[0]] = !config[toggleData[0]];
                                            let delta = {};
                                            delta[toggleData[0]] = config[toggleData[0]];
                                            chrome.storage.sync.set(delta);
                                        });

                                        customSection.appendChild(toggleSwitch);
                                    }

                                    preferencesPanel.appendChild(customSection);
                                    break;
                                default:
                                    break;

                            }
                        }
                    }
                }
            });

            // Execute the observers
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