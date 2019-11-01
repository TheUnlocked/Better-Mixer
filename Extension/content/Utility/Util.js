/**
 * 
 * @param {RequestInfo} url
 * @param {RequestInit} [init]
 */
export const fetchJson = async (url, init) => {
    return fetch(url, init)
        .then(resp => {
            if(resp.status < 200 || resp.status > 299) {
                throw new Error(resp.statusText);
            }
            return resp.json();
        });
};

/**
 * 
 * @param {() => boolean} pred
 * @param {{
 *  delay?: number,
 *  maxAttempts?: number
 * }} [options]
 * @returns {Promise<void>}
 */
export const waitFor = (pred, options) => new Promise((resolve, reject) => {
    options = {
        delay: 100,
        maxAttempts: -1,
        ...options
    };
    let attempts = options.maxAttempts;
    const loop = () => {
        if (attempts-- === 0){
            reject(new Error("Max attempts exceeded."));
        }
        if (pred()){
            resolve();
        }
        setTimeout(loop, options.delay);
    }
    loop();
});

/**
 * 
 * @param {string} selector 
 * @param {Node} parent 
 * @param {(element: Element) => any} callback 
 */
export const observeNewElements = (selector, parent, callback) => {
    const observer = new MutationObserver(muts => {
        const matches = [];
        for (const mut of muts){
            for (const node of mut.addedNodes){
                if (node instanceof Element){
                    if (node.matches(selector)){
                        matches.push(node);
                    }
                    matches.push(...node.querySelectorAll(selector));
                }
            }
        }
        const uniqueMatches = matches.reduce((result, next) => result.includes(next) ? result : (result.push(next), result), []);
        uniqueMatches.forEach(callback);
    });

    observer.observe(parent, {
        childList: true,
        subtree: true
    });
    return observer;
};