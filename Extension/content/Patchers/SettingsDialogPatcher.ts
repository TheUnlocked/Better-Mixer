import Config from "../Configs/Config.js";
import { waitFor } from "../Utility/Promise.js";
import BetterMixer from "../BetterMixer.js";
import DropdownConfig from "../Configs/DropdownConfig.js";

export const patchSettingsDialog = async (plugin: BetterMixer, settingsDialogElement: HTMLElement) => {
    await waitFor(() => settingsDialogElement.querySelector('h2[class*="title"]'));

    const configSection = settingsDialogElement.querySelector('section') as HTMLElement;

    const label = configSection.firstChild!.cloneNode();
    label.textContent = "Better Mixer Preferences";
    configSection.appendChild(label);

    const exampleToggle = configSection.querySelector('[class*="control"][class*="toggle"]') as HTMLElement;

    const configsData: {
        element: HTMLElement;
        config: Config<any>;
        newState: any;
    }[] = [];

    for (const config of plugin.configuration.getAllConfigs()) {
        // Allow a config to fail to load without destroying everything.
        try {
            let state: any;
            let configElement: HTMLElement | undefined;
            const setTempState = (newState: any) => state = newState;

            switch (config.configType) {
                case Config.ConfigTypeEnum.BOOLEAN:
                    configElement = makeToggleSwitch(config, setTempState, exampleToggle);
                    break;

                case Config.ConfigTypeEnum.COLOR:
                    configElement = makeColorPicker(config, setTempState);
                    break;

                case Config.ConfigTypeEnum.DROPDOWN:
                    configElement = makeDropdownMenu(config as DropdownConfig, setTempState);
                    break;

                case Config.ConfigTypeEnum.STRING:
                    configElement = makeStringInput(config, setTempState);
                    break;

                case Config.ConfigTypeEnum.NONE:
                    break;
            }
            if (configElement) {
                configElement.setAttribute('bettermixer-config-name', config.configName);
                configElement.hidden = config.hidden;
                configSection.appendChild(configElement);
                configsData.push({
                    element: configElement,
                    config: config,
                    get newState() { return state; }
                });
            }
        }
        catch (e) {
            plugin.log(e.stack, BetterMixer.LogType.ERROR);
        }
    }

    // Save
    settingsDialogElement.querySelector('button[data-variant="primary"]')!.addEventListener('click', e => {
        for (const configData of configsData) {
            if (configData.newState !== undefined) {
                configData.config.state = configData.newState;
            }
        }
        plugin.configuration.saveConfig();
        plugin.configuration.updateConfig();
        plugin.log("Updated configurations.");
    });
};

const makeToggleSwitch = (config: Config<any>, setTempState: (newState: any) => void, example: HTMLElement) => {
    const toggleHolder = document.createElement('div');
                
    ReactDOM.render(React.createElement(mixerUi.Toggle, {
        children: config.displayText,
        checked: config.state,
        onChange: function(e) {
            this.checked = !this.checked;
            setTempState(this.checked);
            config.updateImmediate(this.checked);
        }
    }), toggleHolder);

    if (config.superText) {
        const superText = document.createElement('span');
        superText.classList.add('bettermixer-config-boxed-supertext');
        superText.innerText = config.superText;
        toggleHolder.children[0].querySelector('label > span')!.appendChild(superText);
    }

    return toggleHolder.children[0] as HTMLElement;
};

const makeColorPicker = (config: Config<string>, setTempState: (newState: string | undefined) => void) => {
    const colorHolder = document.createElement('div');
    const colorLengths = [3, 4, 6, 8];

    ReactDOM.render(React.createElement(mixerUi.SimpleColorPicker, {
        label: config.displayText,
        fallback: '#d37110',
        value: config.state,
        onChange: v => {
            if (v.match(/^#[a-fA-F0-9]*$/) && colorLengths.includes(v.length - 1)) {
                setTempState(v);
                config.updateImmediate(v);
            }
            else {
                setTempState(undefined);
            }
        }
    }), colorHolder);

    if (config.superText) {
        const superText = document.createElement('span');
        superText.classList.add('bettermixer-config-boxed-supertext');
        superText.innerText = config.superText;
        colorHolder.children[0].querySelector('label > span')!.appendChild(superText);
    }

    return colorHolder.children[0] as HTMLElement;
};

const makeDropdownMenu = (config: DropdownConfig, setTempState: (newState: string | undefined) => void) => {
    const dropdownHolder = document.createElement('div');
                
    ReactDOM.render(React.createElement(mixerUi.Select, {
        label: config.displayText,
        options: config.options.map(x => ({key: x, value: config.getDisplayFromOption(x)})),
        value: config.state,
        children: e => React.createElement("div", { className: BetterMixer.ClassNames.TEXTITEM }, e.value),
        onChange: v => {
            setTempState(v);
            config.updateImmediate(v);
        }
    }), dropdownHolder);

    if (config.superText) {
        const superText = document.createElement('span');
        superText.classList.add('bettermixer-config-boxed-supertext');
        superText.innerText = config.superText;
        dropdownHolder.children[0].querySelector('label > span')!.appendChild(superText);
    }

    return dropdownHolder.children[0] as HTMLElement;
};

const makeStringInput = (config: Config<string>, setTempState: (newState: string | undefined) => void) => {
    const stringInputHolder = document.createElement('div');

    ReactDOM.render(React.createElement(mixerUi.BuiTextInput, {
        label: config.displayText,
        value: config.state,
        onChange: (v: string) => {
            setTempState(v);
        }
    }), stringInputHolder);

    if (config.superText) {
        const superText = document.createElement('span');
        superText.classList.add('bettermixer-config-boxed-supertext');
        superText.innerText = config.superText;
        stringInputHolder.children[0].querySelector('label > span')!.appendChild(superText);
    }

    return stringInputHolder.children[0] as HTMLElement;
};