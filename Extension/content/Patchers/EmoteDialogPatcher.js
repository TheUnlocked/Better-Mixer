import EmoteSet from "../EmoteSet.js";
import BetterMixer from "../BetterMixer.js";

export const patchEmoteDialog = (plugin, settingsDialogElement, chat) => {
    const emoteGatherEventData = {
        channel: chat.channel,
        user: plugin.user,
        message: null
    };
    const gatheredEmotes = plugin.dispatchGather(BetterMixer.Events.GATHER_EMOTES, emoteGatherEventData, chat);

    const emoteContainer = settingsDialogElement.querySelector('div[class*="container"]');
    emoteContainer.style.overflow = "hidden";
    
    // Priority 100
    const thisChannelSubscriberEmotesHeader = [...emoteContainer.querySelectorAll('h3[class*="emoteGroupHeader"]')]
        .filter(x => x.innerHTML.toLowerCase() === chat.channel.name.toLowerCase())[0];
    // Priority -200
    const globalEmotesHeader = [...emoteContainer.querySelectorAll('h3[class*="emoteGroupHeader"]')]
        .filter(x => x.innerHTML.toLowerCase() === "global")[0];
    // Priority 50
    const otherSubscriberEmoteHeader = [...emoteContainer.querySelectorAll('h3[class*="emoteGroupHeader"]')]
        .filter(x => x !== thisChannelSubscriberEmotesHeader && x !== globalEmotesHeader)[0];
    const start = document.createElement('div');
    emoteContainer.insertBefore(start, emoteContainer.children[0]);
    const end = document.createElement('div');
    emoteContainer.appendChild(end);

    const exampleButton = emoteContainer.querySelector('button[class*="emoteButton"]');

    let emoteSets = [];
    const uncategorizedEmotes = new EmoteSet("Uncategorized", -100);

    for (const emotes of gatheredEmotes) {
        if (emotes instanceof EmoteSet) {
            emoteSets.push(emotes);
        }
        else {
            uncategorizedEmotes.addEmotes(emotes);
        }
    }

    emoteSets.push(uncategorizedEmotes);
    emoteSets = emoteSets.sort((a, b) => b.priority - a.priority);

    let firstEmoteSet = true;
    const createEmoteSetHeader = title => {
        const mixerEmoteHeader = document.createElement('h3');
        mixerEmoteHeader.classList.add('bettermixer-emote-set-header');
        if (firstEmoteSet) {
            mixerEmoteHeader.classList.add('bettermixer-emote-set-header-first');
            firstEmoteSet = false;
        }
        mixerEmoteHeader.textContent = title;
        return mixerEmoteHeader;
    };

    for (const emoteSet of emoteSets) {
        let emoteSetEmotes = emoteSet.emotes;
        if (!plugin.configuration.getConfig('show_emotes_animated').state) {
            emoteSetEmotes = emoteSetEmotes.filter(emote => !emote.animated);
        }

        if (emoteSetEmotes.length > 0) {
            const emoteSetContainer = document.createElement('div');
            const emoteSetHeader = createEmoteSetHeader(emoteSet.name);
            emoteSetContainer.appendChild(emoteSetHeader);
            for (const emote of [...emoteSetEmotes].reverse()) {
                const emoteButton = exampleButton.cloneNode();
                emoteButton.appendChild(emote.element);
                emoteButton.style.paddingLeft = '4px';
                emoteButton.style.paddingRight = '4px';
                emoteButton.addEventListener('click', () => {
                    const inputBox = chat.element.querySelector('textarea');
                    inputBox.value += `${inputBox.value.length === 0 || inputBox.value.endsWith(' ') ? '' : ' '}${emote.name} `;
                });
                emoteSetContainer.appendChild(emoteButton);
            }

            let beforeElement;
            if (emoteSet.priority < -200) {
                beforeElement = end;
            }
            else if (emoteSet.priority < 50) {
                beforeElement = globalEmotesHeader;
            }
            else if (emoteSet.priority < 100) {
                beforeElement = otherSubscriberEmoteHeader || globalEmotesHeader;
            }
            else {
                beforeElement = thisChannelSubscriberEmotesHeader || start;
            }
            emoteContainer.insertBefore(emoteSetContainer, beforeElement);
            emoteContainer.insertBefore(emoteSetHeader, emoteSetContainer);
        }
    }
    emoteContainer.removeChild(start);
    emoteContainer.removeChild(end);
};
