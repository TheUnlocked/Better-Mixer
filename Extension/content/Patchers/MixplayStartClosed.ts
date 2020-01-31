import { observeNewElements, waitFor, sleep } from "../Utility/Promise.js";
import BetterMixer from "../BetterMixer.js";
import Patcher from "./Patcher.js";

export const loadMixplayStartClosedPatch = (plugin: BetterMixer) => {
    let activeChannel = plugin.focusedChannel;
    let cleared = false;
    let closeLock = false;
    
    plugin.addEventListener('pageLoad', () => {
        closeLock = false;
    });

    const closeMixplay = async (button: HTMLElement) => {
        if (activeChannel !== plugin.focusedChannel) {
            cleared = false;
            activeChannel = plugin.focusedChannel;
        }
        if (cleared || closeLock) {
            return;
        }
        closeLock = true;
        const startClosed = await plugin.configuration.getConfigAsync('mixplay_start_closed');

        if (!document.querySelector('.bettermixer-toggle-start-interactive-closed')) {
            const startClosedButton = document.createElement('button');
            startClosedButton.classList.add('bettermixer-toggle-start-interactive-closed', 'toggle-interactive');
            startClosedButton.setAttribute(button.getAttributeNames().find(x => x.includes('ngcontent'))!, '');
            startClosedButton.classList.toggle('open', !startClosed.state);
            ReactDOM.render(React.createElement(mixerUi.BuiIcon, {
                set: "mixer",
                icon: "ChevronUp"
            }), startClosedButton);
            Patcher.addTooltip(startClosedButton, "Open MixPlay by Default", { y: '10px' });
            button.after(startClosedButton);

            startClosedButton.addEventListener('click', e => {
                startClosedButton.classList.toggle('open');
                startClosed.state = !startClosedButton.classList.contains('open');
                plugin.configuration.saveConfig([startClosed.configName]);
            });
        }

        // Disable stuff if it starts closed
        if (startClosed.state) {
            button.classList.remove('open');
            await waitFor(() => document.querySelector('b-interactive-controls > iframe:not(.minimized)'));
            await sleep(1);
            const sleepTimes = [1, 100, 200, 200];
            const action = async () => {
                const multiPane = document.querySelector('b-channel-profile .toggle-interact-menu');
                if (multiPane) {
                    (multiPane.children[multiPane.childElementCount - 1] as HTMLElement).click();
                }
                else if (document.contains(button)) {
                    button.click();
                }
                else {
                    (document.querySelector('.toggle-interactive:not(.bettermixer-toggle-start-interactive-closed)') as HTMLElement).click();
                }
                cleared = true;
            };
            // If MixPlay mysteriously pops up again, kill it.
            let block = true;
            while (block) {
                await action();
                block = false;
                for (const sleepTime of sleepTimes) {
                    await sleep(sleepTime);
                    if (document.querySelector('b-interactive-controls > iframe:not(.minimized)')) {
                        block = true;
                        break;
                    }
                }
                cleared = true;
            }
        }
        closeLock = false;
    };

    plugin.addEventListener('beforeChannelLoad', event => {
        if (cleared && !plugin.activeChannels.includes(event.data!)) {
            cleared = false;
            activeChannel = undefined;
            if (document.querySelector('.toggle-interactive:not(.bettermixer-toggle-start-interactive-closed)')) {
                closeMixplay(document.querySelector('.toggle-interactive:not(.bettermixer-toggle-start-interactive-closed)') as HTMLElement);
            }
        }
    });
    
    observeNewElements('.toggle-interactive:not(.bettermixer-toggle-start-interactive-closed)', document.documentElement, closeMixplay);
};