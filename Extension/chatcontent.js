// COPYRIGHT © 2018 Unlocked
// "The extension" refers to the "MoreMixer" or "More Mixer" browser extension
// "This code" refers to the code in this document, or any other code in the extension.
// You may modify and redistribute this code or the extension for private use, as long as credit is given.
// If you wish to redistribute or modify this code or the extension for large-scale use, written permission must be obtained.
// Any attempt to intentionally subvert these rules may result in a complete ban from redistributing and/or modifying this code or any part of the extension.


$(function () {
    onetimeInjection().then(() => {
        initialize();
        $(window).on('pushState', () => setTimeout(refreshEmotes, 100));
    });
});

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

        if (usernameOrID.endsWith(')')){
            reject('Not a user');
            return;
        }

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
        'move_badges':          false,
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

function injectFileExtension(src, url, elementType='link', srcType = 'href', loc=document.getElementsByTagName('head')[0]){
    return new Promise((resolve, reject) =>
        chrome.runtime.sendMessage({request: "geturl", data: url}, function (response) {
            let injection = document.createElement(elementType);
            injection.rel = src;
            injection[srcType] = response;
            loc.appendChild(injection);
            resolve(injection);
    }));
}

function toggleElement(element){
    element.disabled = !element.disabled;
}

function Ensure(func){
    return (...args) => new Promise((resolve, reject) => {
        func(...args);
        resolve();
    });
}

let cssInjection;
let botColorInjection;
let hideAvatarInjection;
let moveBadgesInjection;

function onetimeInjection(){
    return new Promise((resolve, reject) => {
        injectFileExtension('stylesheet', 'lib/css/inject.css')
        .then(Ensure((result) => cssInjection = result))
        .then(() => injectFileExtension('stylesheet', 'lib/css/botcolor.css'))
        .then(Ensure((result) => botColorInjection = result))
        .then(() => injectFileExtension('stylesheet', 'lib/css/hideavatars.css'))
        .then(Ensure((result) => hideAvatarInjection = result))
        .then(() => injectFileExtension('stylesheet', 'lib/css/movebadges.css'))
        .then(Ensure((result) => moveBadgesInjection = result))

        
        .then(() => injectFileExtension('stylesheet', 'lib/js/inject.js', elementType = 'script', srcType = 'src'))
        .then(Ensure((result) => result.id = 'better-mixer-injection-script'))
        .then(resolve);
    });
}

function refreshEmotes() {
    resetEmotes();

    return getMixerUsername()
        .then(addUserEmotes, () => new Promise((resolve, reject) => resolve()))
        .then(getBetterMixerConfig);
}

function initialize() {
    refreshEmotes()
    .then(function (config) {
        if (!config.botcolor_enabled){
            botColorInjection.disabled = true;
        }
        if (!config.hide_avatars){
            hideAvatarInjection.disabled = true;
        }
        if (!config.move_badges){
            moveBadgesInjection.disabled = true;
        }
    
        // Search for new chat messages
        $.initialize('b-channel-chat-message', (s, element) => {
            for(let patch of messagePatches) patch(element);
        });
    
        // Observe when new dialogs are opened
        $.initialize('b-channel-chat-emote-dialog', (s, element) => {
            if (Object.keys(customEmotes).length !== 0){
                let emotePanel = element.getElementsByTagName("bui-dialog-content")[0];
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
                                                            .dispatchEvent(new CustomEvent('addToChat', {detail:emoteName})));
                    customTiles.appendChild(emoteTile);
                }
                customTiles.appendChild(document.createElement('hr'));
            }
        });
        $.initialize('b-channel-chat-preferences-dialog', (s, element) => {
            let preferencesPanel = element.getElementsByTagName("bui-dialog-content")[0];
                let sampleSection = preferencesPanel.children[0];
                let customSection = sampleSection.cloneNode();
                customSection.style.marginTop = "24px";
    
                let customLabel = sampleSection.children[0].cloneNode();
                customLabel.innerHTML = "Better Mixer Preferences";
                customSection.appendChild(customLabel);
    
                let toggleList = [
                    ['botcolor_enabled',    "Change Bot Colors",            botColorInjection],
                    ['hide_avatars',        "Hide Avatars",                 hideAvatarInjection],
                    ['move_badges',         "Show Badges Before Username",  moveBadgesInjection]
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
                        let newValue = toggleSwitch.classList.contains('bui-toggle-checked');
                        toggleData[2].disabled = !newValue;
                        config[toggleData[0]] = newValue;
                        let delta = {};
                        delta[toggleData[0]] = newValue;
                        chrome.storage.sync.set(delta);
                    });
    
                    customSection.appendChild(toggleSwitch);
                }
    
                preferencesPanel.appendChild(customSection);
        });
    });
}

let messagePatches = [patchMessageEmotes, patchMessageBotColor, patchMessageBadges];

function patchMessageEmotes(message){
    for (let msgText of message.getElementsByClassName('textComponent')) {
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
function patchMessageBadges(message){
    let authorElement = message.getElementsByTagName('b-channel-chat-author')[0];
    let newBadges = [];

    for (let badge of message.getElementsByClassName('badge')) {
        let newBadge = badge.cloneNode();
        newBadge.classList.add('bettermixer-badge-relocated');
        newBadges.push(newBadge);
    }
    for (let newBadge of newBadges){
        authorElement.prepend(newBadge);
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