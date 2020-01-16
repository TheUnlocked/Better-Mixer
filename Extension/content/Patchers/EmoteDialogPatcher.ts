import EmoteSet from "../EmoteSet.js";
import BetterMixer from "../BetterMixer.js";
import Chat from "../Chat.js";

export const patchEmoteDialog = (plugin: BetterMixer, emotesDialogElement: HTMLElement, chat: Chat) => {
    const emoteGatherEventData = {
        channel: chat.channel,
        user: plugin.user!,
        message: null
    };
    const gatheredEmotes = plugin.dispatchGather('gatherEmotes', emoteGatherEventData, chat);

    const emoteContainer = emotesDialogElement.querySelector('div[class*="container"]') as HTMLElement;
    emoteContainer.style.overflow = "hidden";
    
    const emoteHeaders = [...emoteContainer.querySelectorAll('h3[class*="emoteGroupHeader"]')];

    // Priority 100
    const thisChannelSubscriberEmotesHeader = emoteHeaders.find(x => x.innerHTML.toLowerCase() === chat.channel.name!.toLowerCase());
    // Priority -200
    const globalEmotesHeader = emoteHeaders.find(x => x.innerHTML.toLowerCase() === "global") as HTMLElement;
    // Priority 50
    const otherSubscriberEmoteHeader = emoteHeaders.find(x => x !== thisChannelSubscriberEmotesHeader && x !== globalEmotesHeader);
    
    const start = document.createElement('div');
    emoteContainer.insertBefore(start, emoteContainer.children[0]);
    const end = document.createElement('div');
    emoteContainer.appendChild(end);

    const exampleButton = emoteContainer.querySelector('button[class*="emoteButton"]') as HTMLButtonElement;

    let emoteSets = [];
    const uncategorizedEmotes = new EmoteSet("Uncategorized", -100);

    for (const emotes of gatheredEmotes) {
        if (emotes instanceof EmoteSet) {
            emoteSets.push(emotes);
        }
        else if (emotes) {
            uncategorizedEmotes.addEmotes(emotes);
        }
    }

    emoteSets.push(uncategorizedEmotes);
    emoteSets = emoteSets.sort((a, b) => b.priority - a.priority);

    let firstEmoteSet = true;
    const createEmoteSetHeader = (title: string) => {
        const mixerEmoteHeader = document.createElement('h3');
        mixerEmoteHeader.classList.add('bettermixer-emote-set-header');
        if (firstEmoteSet) {
            mixerEmoteHeader.classList.add('bettermixer-emote-set-header-first');
            firstEmoteSet = false;
        }
        mixerEmoteHeader.textContent = title;
        return mixerEmoteHeader;
    };

    const autofillEmote = (emoteName: string) => {
        const inputBox = chat.element!.querySelector('textarea') as HTMLTextAreaElement;
        inputBox.value += `${inputBox.value.length === 0 || inputBox.value.endsWith(' ') ? '' : ' '}${emoteName} `;
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
                const emoteButton = exampleButton.cloneNode() as HTMLButtonElement;
                emoteButton.appendChild(emote.element);
                emoteButton.style.paddingLeft = '4px';
                emoteButton.style.paddingRight = '4px';
                emoteButton.addEventListener('click', () => autofillEmote(emote.name));
                emoteSetContainer.appendChild(emoteButton);
            }

            let beforeElement: Element;
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
