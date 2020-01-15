export const fetchJson = async (url: RequestInfo, init: RequestInit) => {
    return fetch(url, init)
        .then(resp => {
            if (resp.status < 200 || resp.status > 299) {
                throw new Error(resp.statusText);
            }
            return resp.json();
        });
};

export const waitFor = (pred: () => boolean, _options: { delay?: number; maxAttempts?: number }) => new Promise((resolve, reject) => {
    const options = {
        delay: 100,
        maxAttempts: -1,
        ..._options
    };
    let attempts = options.maxAttempts;
    const loop = () => {
        if (attempts-- === 0) {
            reject(new Error("Max attempts exceeded."));
        }
        if (pred()) {
            resolve();
        }
        setTimeout(loop, options.delay);
    };
    loop();
});

export const executeInOrder = async (functions: (() => any)[]) => {
    for (const func of functions) {
        await func();
    }
};

export const observeNewElements = (selector: string, parent: Node, callback: (element: Element) => void) => {
    const observer = new MutationObserver(muts => {
        const matches = [] as Element[];
        for (const mut of muts) {
            for (const node of mut.addedNodes) {
                if (node instanceof HTMLElement) {
                    if (node.matches(selector)) {
                        matches.push(node);
                    }
                    matches.push(...node.querySelectorAll(selector));
                }
            }
        }
        const uniqueMatches: Element[] = matches.reduce((result, next) => result.includes(next) ? result : (result.push(next), result), []);
        uniqueMatches.forEach(match => {
            try {
                callback(match);
            }
            catch (error) {
                console.error(error);
            }
        });
    });

    observer.observe(parent, {
        childList: true,
        subtree: true
    });
    return observer;
};