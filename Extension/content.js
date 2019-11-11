const DEBUG_MODE = !('update_url' in chrome.runtime.getManifest());

if (DEBUG_MODE) {
    console.log("%c[Better Mixer] Running in debug mode.", "font-size: 16px; background: black; color: white; padding: 2px 4px 2px 2px;");
    const hintFormatting = "background: #05a; color: white; padding: 2px 3px;";
    console.log("%cBetterMixer.instance.postToContent({message: 'ping'})", hintFormatting);
    console.log("%cBetterMixer.instance.postToContent({message: 'clearAllConfigs'})", hintFormatting);
}

document.body.onload = () => {
    const injection = document.createElement('script');
    injection.src = chrome.runtime.getURL('content/BetterMixer.js');
    injection.id = "BetterMixer-module";
    injection.type = "module";
    document.head.appendChild(injection);

    const SRC = injection.src;
    const MIXER = "https://mixer.com";

    window.addEventListener('message', (event) => {
        if (event.origin === MIXER) {
            if (event.data[0] === SRC) {
                const data = event.data[1];
                switch (data.message) {
                    case 'getAllConfigs':
                        chrome.storage.sync.get(null, (result) =>
                            window.postMessage([SRC, {message: 'sendAllConfigs', data: result}], MIXER)
                        );
                        break;
                    case 'setConfigs':
                        chrome.storage.sync.set(data.data);
                        break;
                }

                if (DEBUG_MODE) {
                    if (data.message === 'clearAllConfigs')
                        chrome.storage.sync.clear();
                    if (data.message === 'ping')
                        console.log('pong');
                }
            }
        }
    }, false);
};