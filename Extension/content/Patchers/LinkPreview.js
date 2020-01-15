import BetterMixer from "../BetterMixer.js";

/**
 * 
 * @param {BetterMixer} plugin 
 * @param {HTMLElement} msgElement 
 * @param {string} link 
 */
export const loadLinkPreview = async (plugin, msgElement, link) => {
    const requestAddress = `https://bettermixer.web.app/api/v1/url-preview?urlb64=${btoa(link)}`;
    const urlPreviewResponse = await fetch(requestAddress);
    if (!urlPreviewResponse.ok) {
        plugin.log("Failed to get link preview information. Is the server down or being throttled?", BetterMixer.LogType.ERROR);
        return;
    }
    const urlInfo = await (urlPreviewResponse).json();

    /* Logging information about where the response came from */
    const matchingPerfEntries = performance.getEntriesByName(requestAddress);
    if (matchingPerfEntries.length === 0) {
        plugin.log("URL preview retrieved, but cannot determine whether or not it was cached (likely server)", BetterMixer.LogType.INFO);
    }
    else if (matchingPerfEntries[matchingPerfEntries.length - 1].transferSize === 0) {
        plugin.log("URL preview retrieved from cache", BetterMixer.LogType.INFO);
    }
    else {
        plugin.log("URL preview retrieved from server", BetterMixer.LogType.INFO);
    }
    const previewElt = document.createElement('div');
    
    previewElt.classList.add('bettermixer-link-preview');

    const titleLink = document.createElement('a');
    titleLink.href = link;
    titleLink.target = "_blank";
    titleLink.addEventListener('mouseup', e => {
        e.stopImmediatePropagation();
    });
    const titleText = document.createElement('h3');
    titleText.innerText = urlInfo.title;
    titleLink.appendChild(titleText);
    previewElt.appendChild(titleLink);

    const lowerContainer = document.createElement('div');

    if (urlInfo.image) {
        const imageLink = document.createElement('a');
        imageLink.href = link;
        imageLink.target = "_blank";
        imageLink.addEventListener('mouseup', e => {
            e.stopImmediatePropagation();
        });
        const imageElt = document.createElement('img');
        imageElt.src = urlInfo.image;
        imageLink.appendChild(imageElt);
        lowerContainer.appendChild(imageLink);
    }
    
    const descElt = document.createElement('span');
    descElt.innerText = urlInfo.description || 'This site provides no description.';
    lowerContainer.appendChild(descElt);

    descElt.addEventListener('mouseup', e => {
        e.stopImmediatePropagation();
    });

    previewElt.appendChild(lowerContainer);
    msgElement.appendChild(previewElt);
};