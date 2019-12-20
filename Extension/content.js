const DEBUG_MODE = !('update_url' in chrome.runtime.getManifest());

if (DEBUG_MODE) {
    console.log("%c[Better Mixer] Running in debug mode.", "font-size: 16px; background: black; color: white; padding: 2px 4px 2px 2px;");
    const hintFormatting = "background: #05a; color: white; padding: 2px 3px;";
    console.log("%cBetterMixer.instance.postToContent({message: 'ping'})", hintFormatting);
    console.log("%cBetterMixer.instance.postToContent({message: 'clearAllConfigs'})", hintFormatting);
}

if (window.location.search) {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('bettermixer-message')) {
        (async () => {
            const currentUser = await (await fetch('https://mixer.com/api/v1/users/current')).json();
            const validateAuth = async auth => {
                try {
                    const response = await fetch('https://mixer.com/api/v1/oauth/token/introspect', {
                        method: "POST",
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({token: auth})
                    });
                    const data = await response.json();
                    if (data.active &&
                        data.scope.split(' ').includes('channel:update:self') &&
                        data.username === currentUser.username &&
                        data.client_id === '473772fa4fa6d46b0c73f2aca560215cf602d1c2e925e521') {
                        return true;
                    }
                }
                catch { }
                return false;
            };
            const getJWT = async () => {
                const response = await fetch('https://mixer.com/api/v1/jwt/authorize', {
                    method: "POST",
                    headers: {'client-id': '473772fa4fa6d46b0c73f2aca560215cf602d1c2e925e521'}
                });
                const jwt = response.headers.get('x-jwt');
                return jwt;
            };
            switch (sp.get('bettermixer-message')) {
                case 'description':
                    if (await validateAuth(sp.get('bettermixer-auth'))) {
                        if (sp.get('bettermixer-message-data')) {
                            const jwt = await getJWT();
                            const patchResponse = await fetch(`https://mixer.com/api/v1/channels/${currentUser.channel.id}`, {
                                method: "PATCH",
                                headers: {
                                    'Content-Type': 'application/json',
                                    'authorization': `JWT ${jwt}`
                                },
                                body: JSON.stringify({"description": atob(sp.get('bettermixer-message-data').replace(/ /g, '+'))})
                            });
                            if (patchResponse.ok) {
                                window.close();
                            }
                        }
                    }
                    break;
                default:
                    console.log(`Unknown Better Mixer message ${sp.get('bettermixer-message')}`);
            }
        })();
    }
}

const onLoad = () => {
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

if (document.readyState === "complete") {
    onLoad();
}
document.body.onload = onLoad;