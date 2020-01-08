export const loadLinkPreview = async (plugin, msgElement, link) => {
    const urlInfo = await (await fetch(`https://bettermixer.web.app/api/v1/url-preview?urlb64=${btoa(link)}`)).json();
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
        const imageElt = document.createElement('img');
        imageElt.src = urlInfo.image;
        lowerContainer.appendChild(imageElt);
    }

    
    const descElt = document.createElement('span');
    descElt.innerText = urlInfo.description || 'This site provides no description.';
    lowerContainer.appendChild(descElt);

    previewElt.appendChild(lowerContainer);
    msgElement.appendChild(previewElt);
};