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
            <img src="${img}" alt="${alt}" title="${alt}" /></div>`;
}

function getMixerUsername() {
    return new Promise(function (resolve, reject) {
        // Get username or user ID
        let usernameOrID = /\/[0-z]*(?=$)/gi.exec(window.location.href)[0].slice(1); // Sadly this won't work for co-streams.
        // If the retrieved identifier is the user ID, get their username.
        let userID = parseInt(usernameOrID);
        if (userID) {
            $.getJSON(`https://mixer.com/api/v1/channels/${userID}/details`, function (data) {
                resolve(data.token);
            });
        } else {
            resolve(usernameOrID);
        }
    });
}

function addUserEmotes(username) {
    return new Promise(function (resolve, reject) {
        $.getJSON("https://raw.githubusercontent.com/TheUnlocked/Better-Mixer/master/Info/ffzsync.json", function (userSync) {
            $.getJSON(`https://api.frankerfacez.com/v1/room/${userSync[username]}`, function (data) {
                let userEmotes = {};
                for (let emoteSet in data.sets) {
                    for (let emote of data.sets[emoteSet].emoticons) {
                        userEmotes[emote.name] = [emote.urls["1"], emote.height];
                    }
                }
                Object.assign(customEmotes, userEmotes);
                console.log(`Added emotes for ${username}`);
            })
            .always((_, __) => resolve());
        });
    });
}

function resetEmotes() {
    customEmotes = {
        "TestEmote": ["https://i.imgur.com/Fm8qROA.png", 28]
    };
}

function addClass(name, def) {
    let styleEmotes = document.createElement('style');
    styleEmotes.type = 'text/css';
    styleEmotes.innerHTML = `.${name}{${def}}`;
    document.getElementsByTagName('body')[0].appendChild(styleEmotes);
    return def;
}

let observer;

function ext() {
    if (observer) {
        observer.disconnect();
    }

    resetEmotes();

    let emotesStyle = addClass('bettermixer-emotes', 'position: relative; display: inline-flex; align-items: center; justify-content: center; margin: -6px 2px 0; top: 5px;');

    let botColor = '#ff8f20';
    let botsStyleAvatar = addClass('bettermixer-bots .image', `background-color: ${botColor} !important;`);
    let botsStyleUsername = addClass('bettermixer-bots .username', `color: ${botColor} !important;`);

    getMixerUsername()
        .then(addUserEmotes)
        .then(function () {
            // Search for new chat messages
            observer = new MutationObserver(function (mutations) {
                for (let mutation of mutations) {
                    if (mutation.addedNodes.length == 1) {
                        let addedElement = mutation.addedNodes[0];
                        for (let addedMsg of addedElement.getElementsByTagName("b-channel-chat-message")) {

                            // Bot fading
                            if (addedElement.getElementsByClassName("username")[0].innerText.toLowerCase().includes("bot")){
                                addedElement.getElementsByTagName("b-channel-chat-author")[0].classList.add('bettermixer-bots');
                            }

                            // Emotes
                            for (let msgText of addedMsg.getElementsByClassName("textComponent")) {
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
                    }
                }
            });

            // Execute the observer
            observer.observe(document.getElementsByClassName("message-container")[0], {
                "childList": true
            });
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