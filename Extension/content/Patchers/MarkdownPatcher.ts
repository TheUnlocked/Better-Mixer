import ChatMessage from "../ChatMessage.js";

const inlineCodeRegex = /(?<!\\)(?:\\{2})*`(.*?)`/gu;
const underlineRegex = /(?<!\\)(?:\\{2})*_{2}(?!_)(.*?)(?<!\\)(?:\\{2})*_{2}/gu;
const boldRegex = /(?<!\\)(?:\\{2})*\*{2}(?!\*)(.*?)(?<!\\)(?:\\{2})*\*{2}/gu;
const italicsRegex = /(?<!\\)(?:\\{2})*(?:_(.*?)(?<!\\)(?:\\{2})*_|\*(.*?)(?<!\\)(?:\\{2})*\*)/gu;

const passes: [RegExp, (...matches: string[]) => string | HTMLElement][] = [
    [
        inlineCodeRegex,
        (_, inner) => {
            const newText = document.createElement('code');
            newText.innerText = inner;
            return newText;
        }
    ],
    [
        underlineRegex,
        (_, inner) => `<span style="text-decoration: underline;">${inner}</span>`
    ],
    [
        boldRegex,
        (_, inner) => `<span style="font-weight: bold;">${inner}</span>`
    ],
    [
        italicsRegex,
        (_, innerUnderscore, innerAsterisk) => `<span style="font-style: italic;">${innerUnderscore || innerAsterisk}</span>`
    ]
];

export const patchMessageMarkdown = (message: ChatMessage) => {
    const parts = [...message.element.querySelectorAll('span:not([class])')] as HTMLElement[];

    for (const part of parts) {
        let subParts: (string | HTMLElement)[] = [part.innerText];
        for (const pass of passes) {
            const newSubParts: (string | HTMLElement)[] = [];
            for (const piece of subParts) {
                if (typeof piece === 'string') {
                    let buffer = "";
                    let finishedIndex = 0;
                    for (const match of piece.matchAll(pass[0])) {
                        buffer += piece.slice(finishedIndex, match.index);
                        
                        const converted = pass[1](...match);
                        if (typeof converted === 'string') {
                            buffer += converted;
                        }
                        else {
                            if (buffer !== "") {
                                newSubParts.push(buffer);
                                buffer = "";
                            }
                            newSubParts.push(converted);
                        }

                        finishedIndex = match.index! + match[0].length;
                    }
                    buffer += piece.slice(finishedIndex);
                    if (buffer !== "") {
                        newSubParts.push(buffer);
                    }
                }
                else {
                    newSubParts.push(piece);
                }
            }
            subParts = newSubParts;
        }
        subParts.map(x => {
            if (typeof x === 'string') {
                const clone = part.cloneNode() as HTMLElement;
                clone.innerHTML = x;
                clone.classList.add('bettermixer-markdown');
                return clone;
            }
            x.classList.add('bettermixer-markdown');
            return x;
        }).forEach(x => {
            part.parentElement!.insertBefore(x, part);
        });
        part.classList.add('bettermixer-markdown-original');
    }
};