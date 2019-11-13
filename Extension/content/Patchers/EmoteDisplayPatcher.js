import EmoteSet from "../EmoteSet.js";

export const parseMessageEmotes = (plugin, message, emoteSets = undefined) => {
    const emoteGatherEventData = {
        channel: message.chat.channel,
        user: message.author,
        message: message
    };
    const emoteList = (emoteSets || plugin.dispatchGather(BetterMixer.Events.GATHER_EMOTES, emoteGatherEventData, message))
        .reduce((acc, val) => !val ? acc : val instanceof EmoteSet ? acc.concat(val.emotes) : acc.concat(val), []);
    const emotes = emoteList.reduce((result, value) => { result[value.name] = value; return result; }, {});

    const textPieces = [...message.element.querySelectorAll('span')];
    for (const textElement of textPieces) {
        // If the text piece is an actual html element, skip it.
        if (!(textElement.children.length === 0 && textElement.childNodes.length > 0)) {
            continue;
        }

        // Break it up into text pieces, and check each piece for an emote
        const words = textElement.innerHTML.trim().split(" ");
        const messageBuilder = [];

        // Buffer used to retain non-emote text
        let textBuilder = "";
        for (const word of words) {
            const emote = emotes[word];
            if (emote) {
                // End the text element if you find an emote
                if (textBuilder) {
                    const newText = textElement.cloneNode();
                    newText.textContent = textBuilder.trimStart();
                    messageBuilder.push(newText);
                    textBuilder = " ";
                }
                else {
                    const newText = document.createElement('span');
                    newText.textContent = " ";
                    messageBuilder.push(newText);
                }
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
            const newText = textElement.cloneNode();
            newText.textContent = textBuilder;
            messageBuilder.push(newText);
        }

        // Final padding
        const newText = document.createElement('span');
        newText.textContent = " ";
        messageBuilder.push(newText);

        // Replace the text element with the new text/emote elements
        for (const word of messageBuilder) {
            textElement.parentElement.insertBefore(word, textElement);
            //textElement.parentElement.insertBefore(document.createTextNode(' '), textElement);
        }
        textElement.parentElement.removeChild(textElement);
    }
};