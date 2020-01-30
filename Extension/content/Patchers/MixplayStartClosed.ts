import { observeNewElements, waitFor, sleep } from "../Utility/Promise.js";
import BetterMixer from "../BetterMixer.js";
import Patcher from "./Patcher.js";

export const loadMixplayStartClosedPatch = (plugin: BetterMixer) => {
    let activeChannel = plugin.focusedChannel;
    let cleared = false;
    plugin.addEventListener('pageLoad', () => {
        cleared = false;
        activeChannel = undefined;
    });
    observeNewElements('.toggle-interactive:not(.bettermixer-toggle-start-interactive-closed)', document.documentElement, async button => {
        if (activeChannel !== plugin.focusedChannel) {
            cleared = false;
            activeChannel = plugin.focusedChannel;
        }
        else if (cleared) {
            return;
        }
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
            }
        }
    });
};