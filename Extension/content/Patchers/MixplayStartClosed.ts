import { observeNewElements, waitFor, sleep } from "../Utility/Promise.js";
import BetterMixer from "../BetterMixer.js";
import Patcher from "./Patcher.js";

export const loadMixplayStartClosedPatch = (plugin: BetterMixer) => {
    observeNewElements('.toggle-interactive:not(.bettermixer-toggle-start-interactive-closed)', document.documentElement, async button => {
        const startClosedButton = document.createElement('button');
        startClosedButton.classList.add('bettermixer-toggle-start-interactive-closed', 'toggle-interactive');
        startClosedButton.setAttribute(button.getAttributeNames().find(x => x.includes('ngcontent'))!, '');
        ReactDOM.render(React.createElement(mixerUi.BuiIcon, {
            set: "mixer",
            icon: "ChevronUp"
        }), startClosedButton);
        Patcher.addTooltip(startClosedButton, "Open MixPlay by Default", { y: '10px' });
        button.after(startClosedButton);
        
        const startClosed = await plugin.configuration.getConfigAsync('mixplay_start_closed');

        startClosedButton.addEventListener('click', e => {
            startClosedButton.classList.toggle('open');
            startClosed.state = !startClosedButton.classList.contains('open');
            plugin.configuration.saveConfig([startClosed.configName]);
        });

        // Disable stuff if it starts closed
        if (startClosed.state) {
            button.classList.remove('open');
            let controls: HTMLElement = null!;
            await waitFor(() => controls = document.querySelector('.interactive-controls') as HTMLElement);
            controls.style.display = 'none';
            await waitFor(() => !document.querySelector('b-interactive-controls > .minimized'));
            while (!document.querySelector('b-interactive-controls > .minimized')) {
                button.click();
                await sleep(1);
            }
            controls.style.display = '';   
        }
        else {
            startClosedButton.classList.add('open');
        }
    });
};