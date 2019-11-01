/**
 * 
 * @param {RequestInfo} url
 * @param {RequestInit} [init]
 */
export function requestJson(url, init) {
    return fetch(url, init)
        .then(resp => {
            if(resp.status < 200 || resp.status > 299) {
                throw new Error(resp.statusText);
            }
            return resp.json();
        });
}