const IS_USER_SCRIPT = __COMPILER_INLINE('target') === 'script';

const DEBUG_MODE = IS_USER_SCRIPT ? false : !('update_url' in chrome.runtime.getManifest());

declare const browser: any;

if (DEBUG_MODE) {
    console.log("%c[Better Mixer] Running in debug mode.", "font-size: 16px; background: black; color: white; padding: 2px 4px 2px 2px;");
    const hintFormatting = "background: #05a; color: white; padding: 2px 3px;";
    console.log("%cBetterMixer.instance.postToContent({message: 'ping'})", hintFormatting);
    console.log("%cBetterMixer.instance.postToContent({message: 'clearAllConfigs'})", hintFormatting);
}

const onLoad = () => {
    let SRC = 'better_mixer_user_script';
    if (IS_USER_SCRIPT) {
        // eslint-disable-next-line no-undef
        require('./content/BetterMixer.js');
    }
    else {
        const injection = document.createElement('script');
        injection.src = chrome.runtime.getURL('content/BetterMixer.js');
        injection.id = "BetterMixer-module";
        injection.type = "module";
        document.head.appendChild(injection);
        SRC = injection.src;
    }

    const MIXER = "https://mixer.com";
    
    let storage: chrome.storage.LocalStorageArea;
    if (IS_USER_SCRIPT) {
        const LOCAL_STORAGE_NAME = '__better_mixer_script_storage';
        const configData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_NAME) ?? "{}");
        storage = {
            QUOTA_BYTES: -1,
            getBytesInUse: () => undefined,
            clear: () => localStorage.setItem(LOCAL_STORAGE_NAME, "{}"),
            get: (
                keys: string | string[] | { [key: string]: any } | null | ((items: { [key: string]: any }) => void),
                callback?: ((items: { [key: string]: any }) => void)
            ) => {
                if (keys === null) {
                    callback!(configData);
                }
                else if (typeof keys === 'string') {
                    callback!({[keys]: configData[keys]});
                }
                else if (keys instanceof Array) {
                    callback!(Object.fromEntries(Object.entries(configData).filter(x => keys.includes(x[0]))));
                }
                else if (typeof keys === 'function') {
                    keys(configData);
                }
                else {
                    callback!(Object.assign(Object.fromEntries(Object.entries(configData).filter(x => x[0] in keys)), keys));
                }
            },
            set: (items: { [key: string]: any }, callback?: () => void) => {
                Object.assign(configData, items);
                localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(configData));
                callback?.();
            },
            remove: (keys: string | string[], callback?: () => void) => {
                if (typeof keys === 'string') {
                    delete configData[keys];
                }
                else {
                    keys.forEach(key => delete configData[key]);
                }
                localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(configData));
                callback?.();
            }
        };
    }
    else if (typeof browser === "undefined") {
        // we're on chrome
        storage = chrome.storage.sync;
    }
    else {
        // we're on firefox
        storage = chrome.storage.local;
    }

    window.addEventListener('message', (event) => {
        if (IS_USER_SCRIPT || event.origin === MIXER) {
            if (event.data[0] === SRC) {
                const data = event.data[1];
                switch (data.message) {
                    case 'getAllConfigs':
                        storage.get(null, (result) =>
                            window.postMessage([SRC, {message: 'sendAllConfigs', data: result}], MIXER)
                        );
                        break;
                    case 'setConfigs':
                        storage.set(data.data);
                        break;
                }

                if (DEBUG_MODE) {
                    if (data.message === 'clearAllConfigs')
                        storage.clear();
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