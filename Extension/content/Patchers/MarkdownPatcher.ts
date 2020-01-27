import ChatMessage from "../ChatMessage.js";
import { findMin } from "../Utility/Functional.js";
import { sliceMany } from "../Utility/String.js";

const inlineCodeRegex = /(?<!\\)(?:\\{2})*`(.+?)`/u;
const underlineRegex = /(?<!\\)(?:\\{2})*_{2}(?!_)(.+?)(?<!\\)(?:\\{2})*_{2}/u;
const boldRegex = /(?<!\\)(?:\\{2})*\*{2}(?!\*)(.+?)(?<!\\)(?:\\{2})*\*{2}/u;
const italicsRegex = /(?<!\\)(?:\\{2})*(?:_(.+?)(?<!\\)(?:\\{2})*_|\*(.+?)(?<!\\)(?:\\{2})*\*)/u;

type Pass = {
    regex: RegExp;
    fix: (...matches: string[]) => string | HTMLElement;
    allowInside: Pass[] | 'any';
    priority: number;
};

const codePass: Pass = {
    regex: inlineCodeRegex,
    fix: (_, inner) => {
        const newText = document.createElement('code');
        newText.innerText = inner;
        return newText;
    },
    allowInside: [],
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
    message.element.querySelectorAll('[class*="messageContent"] > span:not([class*="username"])').forEach(originalContents => {
        const newContents = originalContents.cloneNode(true) as HTMLElement;
        patchElementMarkdown(newContents, passes);
        newContents.classList.add('bettermixer-markdown');
        originalContents.classList.add('bettermixer-markdown-original');
        originalContents.parentElement!.insertBefore(newContents, originalContents);
    }); 

const patchElementMarkdown = (element: HTMLElement, passes: Pass[], existingReplacements: HTMLElement[] = []) => {
    let str = element.innerText;
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
            patchElementMarkdown(replacement, bestPass.allowInside === 'any' ? passes : bestPass.allowInside, replacements);
        }
    }

    const sliceIndexes = [...str.matchAll(/\0(\d+?)\0/g)].map(match => [match.index!, match.index! + match[0].length]).flat(1);
    element.childNodes.forEach(x => x.remove());
    sliceMany(str, sliceIndexes).map(x => {
        const match = x.match(/\0(\d+?)\0/);
        if (match) {
            return replacements[+match[1]];
        }
        return [new Text(x)];
    }).flat(1).forEach(x => element.appendChild(x));
};