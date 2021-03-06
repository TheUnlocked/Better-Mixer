import ChatMessage from "../ChatMessage.js";
import { findMin } from "../Utility/Functional.js";
import { sliceMany } from "../Utility/String.js";
import { RAW_MESSAGE_TEXT_QUERY_SELECTOR } from "../Utility/Constants.js";

// Firefox doesn't like lookbehind, so we need to provide a fallback
const regexWithFallback = (attept: [string, string], fallback: [string, string]) => {
    try {
        return new RegExp(attept[0], attept[1]);
    }
    catch {
        return new RegExp(fallback[0], fallback[1]);
    }
};

/* Original RegEx expressions */
// const inlineCodeRegex = /(?<!\\)(?:\\{2})*`(.+?)`/us;
// const underlineRegex = /(?<!\\)(?:\\{2})*_{2}(?!_)(.+?)(?<!\\)(?:\\{2})*_{2}/us;
// const boldRegex = /(?<!\\)(?:\\{2})*\*{2}(?!\*)(.+?)(?<!\\)(?:\\{2})*\*{2}/us;
// const italicsRegex = /(?<!\\)(?:\\{2})*(?:_(.+?)(?<!\\)(?:\\{2})*_|\*(.+?)(?<!\\)(?:\\{2})*\*)/us;

const inlineCodeRegex = regexWithFallback(
    ['(?<!\\\\)(?:\\\\{2})*`(.+?)`', 'us'],
    ['`(.+?)`', 'u']);
const underlineRegex = regexWithFallback(
    ['(?<!\\\\)(?:\\\\{2})*_{2}(?!_)(.+?)(?<!\\\\)(?:\\\\{2})*_{2}', 'us'],
    ['_{2}(?!_)(.+?)_{2}', 'u']);
const boldRegex = regexWithFallback(
    ['(?<!\\\\)(?:\\{2})*\\*{2}(?!\\*)(.+?)(?<!\\\\)(?:\\\\{2})*\\*{2}', 'us'],
    ['\\*{2}(?!\\*)(.+?)\\*{2}', 'u']);
const italicsRegex = regexWithFallback(
    ['(?<!\\\\)(?:\\\\{2})*(?:_(.+?)(?<!\\\\)(?:\\\\{2})*_|\\*(.+?)(?<!\\\\)(?:\\\\{2})*\\*)', 'us'],
    ['_(.+?)_|\\*(.+?)\\*', 'u']);

type Pass = {
    regex: RegExp;
    fix: (...matches: string[]) => string | HTMLElement;
    allowInside: Pass[] | 'any';
    priority: number;
    noSpanWrap?: boolean;
};

const codePass: Pass = {
    regex: inlineCodeRegex,
    fix: (_, inner) => {
        const newText = document.createElement('code');
        newText.innerText = inner;
        return newText;
    },
    allowInside: [],
    noSpanWrap: true,
    priority: 2
};

const underlinePass: Pass = {
    regex: underlineRegex,
    fix: (_, inner) => {
        const newText = document.createElement('span');
        newText.innerText = inner;
        newText.style.textDecoration = 'underline';
        return newText;
    },
    allowInside: 'any',
    priority: 1
};

const boldPass: Pass = {
    regex: boldRegex,
    fix: (_, inner) => {
        const newText = document.createElement('span');
        newText.innerText = inner;
        newText.style.fontWeight = 'bold';
        return newText;
    },
    allowInside: 'any',
    priority: 1
};

const italicsPass: Pass = {
    regex: italicsRegex,
    fix: (_, innerUnderscore, innerAsterisk) => {
        const newText = document.createElement('span');
        newText.innerText = innerUnderscore || innerAsterisk;
        newText.style.fontStyle = 'italic';
        return newText;
    },
    allowInside: 'any',
    priority: 0
};

const passes: Pass[] = [
    codePass,
    underlinePass,
    boldPass,
    italicsPass
];

export const patchMessageMarkdown = (message: ChatMessage) =>
    message.element.querySelectorAll(RAW_MESSAGE_TEXT_QUERY_SELECTOR).forEach(originalContents => {
        if (originalContents.children.length > 0) {
            return;
        }

        const newContents = originalContents.cloneNode(true) as HTMLElement;
        patchElementMarkdown(newContents, passes);
        newContents.classList.add('bettermixer-markdown');
        originalContents.parentElement!.insertBefore(newContents, originalContents);

        const originalContentsWrapper = document.createElement('span');
        originalContents.parentElement!.insertBefore(originalContentsWrapper, originalContents);
        originalContentsWrapper.appendChild(originalContents);
        originalContentsWrapper.classList.add('bettermixer-markdown-original');
    }); 

const patchElementMarkdown = (element: HTMLElement, passes: Pass[], existingReplacements: HTMLElement[] = [], noSpanWrap?: boolean) => {
    let str = element.innerText.replace(/\n/g, ' ');
    const replacements: HTMLElement[] = [...existingReplacements];
    
    while (true) {
        if (passes.length === 0) {
            break;
        }
        
        const [bestPass, bestMatch] = findMin(
            passes.map((x): [Pass, RegExpMatchArray | null] => [x, str.match(x.regex)]),
            x => x[1] === null ? str.length : x[1].index! - x[0].priority * str.length)!;

        if (!bestMatch) {
            break;
        }

        const replacement = bestPass.fix(...bestMatch);
        if (typeof replacement === 'string') {
            str = str.slice(0, bestMatch.index) + replacement + str.slice(bestMatch.index! + bestMatch[0].length);
        }
        else {
            str = str.slice(0, bestMatch.index) + `\0${replacements.length}\0` + str.slice(bestMatch.index! + bestMatch[0].length);
            replacements.push(replacement);
            patchElementMarkdown(
                replacement,
                bestPass.allowInside === 'any' ? passes : bestPass.allowInside,
                replacements,
                bestPass.noSpanWrap);
        }
    }

    const sliceIndexes = [...str.matchAll(/\0(\d+?)\0/g)].map(match => [match.index!, match.index! + match[0].length]).flat(1);
    element.childNodes.forEach(x => x.remove());
    sliceMany(str, sliceIndexes).map(x => {
        if (x === "") {
            return undefined;
        }
        const match = x.match(/\0(\d+?)\0/);
        if (match) {
            return replacements[+match[1]];
        }
        else if (noSpanWrap) {
            return new Text(x);
        }
        const containerSpan = document.createElement('span');
        containerSpan.innerText = x;
        return containerSpan;
    }).filter(x => x).forEach(x => element.appendChild(x!));
};