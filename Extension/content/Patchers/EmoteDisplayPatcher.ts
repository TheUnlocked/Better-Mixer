import EmoteSet from "../EmoteSet.js";
import BetterMixer from "../BetterMixer.js";
import ChatMessage from "../ChatMessage.js";
import Emote from "../Emote.js";
import { RAW_TEXT_STRING_QUERY_SELECTOR } from "../Utility/Constants.js";

export const parseMessageEmotes = (plugin: BetterMixer, message: ChatMessage, emoteSets?: EmoteSet[]) => {
    const emoteGatherEventData = {
        channel: message.chat.channel,
        user: message.author,
        message: message
    };
    const emoteList = (emoteSets || plugin.dispatchGather('gatherEmotes', emoteGatherEventData, message))
        .reduce((acc: Emote[], val) => !val ? acc : val instanceof EmoteSet ? acc.concat(val.emotes) : acc.concat(val), []);
    const emotes = emoteList.reduce((result, value) => { result[value.name] = value; return result; }, {} as {[emoteName: string]: Emote});

    const textPieces = [...message.element.querySelectorAll(RAW_TEXT_STRING_QUERY_SELECTOR)] as HTMLElement[];
    let textBuilder = "";
    for (const textElement of textPieces) {
        // If the text piece is an actual html element, skip it.
        if (!(textElement.children.length === 0 && textElement.childNodes.length > 0)) {
            continue;
        }

        // Break it up into text pieces, and check each piece for an emote
        const words = textElement.innerText.trim().split(" ");
        const messageBuilder = [];

        // Buffer used to retain non-emote text
        for (const word of words) {
            const emote = emotes[word];
            if (emote) {
                // End the text element if you find an emote
                const newText = textElement.cloneNode() as HTMLElement;
                newText.innerHTML = textBuilder;
                messageBuilder.push(newText);
                textBuilder = " ";
                // Push the emote
                messageBuilder.push(emote.element);
            } else {
                if (!textBuilder && messageBuilder.length !== 0) {
                    textBuilder = " ";
                }
                textBuilder += `${word} `;
            }
        }
        // Finish the text buffer, if one exists
        if (textBuilder) {
            const newText = textElement.cloneNode() as HTMLElement;
            newText.innerText = textBuilder;
            messageBuilder.push(newText);
            textBuilder = " ";
        }

        // Final padding
        const newText = document.createElement('span');
        newText.textContent = " ";
        messageBuilder.push(newText);

        // Replace the text element with the new text/emote elements
        for (const word of messageBuilder) {
            textElement.parentElement!.insertBefore(word, textElement);
            //textElement.parentElement.insertBefore(document.createTextNode(' '), textElement);
        }
        textElement.parentElement!.removeChild(textElement);
    }
};