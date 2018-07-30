$(() => {
    let jquery = document.createElement('script');
    jquery.src = chrome.runtime.getURL('lib/js/jquery-3.3.1.min.js');
    let jqueryInit = document.createElement('script');
    jqueryInit.src = chrome.runtime.getURL('lib/js/jquery.initialize.min.js');
    let injection = document.createElement('script');
    injection.src = chrome.runtime.getURL('content/BetterMixer.js');
    injection.id = "BetterMixer-module";
    injection.type = "module";
    document.head.appendChild(jquery);
    document.head.appendChild(jqueryInit);
    document.head.appendChild(injection);

    SRC = injection.src;
    MIXER = "https://mixer.com";

    window.addEventListener('message', (event) => {
        if (event.origin == MIXER){
            if (event.data[0] == SRC){
                let data = event.data[1];
                switch(data.message){
                    case 'getAllConfigs':
                        chrome.storage.sync.get(null, (result) =>
                            window.postMessage([SRC, {message: 'sendAllConfigs', data: result}], MIXER)
                        );
                        break;
                    case 'setConfigs':
                        chrome.storage.sync.set(data.data);
                        break;
                }
            }
        }
    }, false);
});