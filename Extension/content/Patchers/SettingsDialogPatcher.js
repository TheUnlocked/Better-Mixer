import Config from "../Configs/Config.js";
import { waitFor } from "../Utility/Util.js";
import BetterMixer from "../BetterMixer.js";

export const patchSettingsDialog = async (plugin, settingsDialogElement) => {
    await waitFor(() => settingsDialogElement.querySelector('h2[class*="title"]'));

    const configSection = settingsDialogElement.querySelector('section');

    const label = configSection.firstChild.cloneNode();
    label.textContent = "Better Mixer Preferences";
    configSection.appendChild(label);

    const exampleToggle = configSection.querySelector('[class*="control"][class*="toggle"]');

    const configsData = [];

    for (const config of plugin.configuration.getAllConfigs()) {
        // Allow a config to fail to load without destroying everything.
        try {
            let configElement;
            const setTempState = newState => configElement.tempState = newState;

            switch (config.configType) {
                case Config.ConfigTypeEnum.BOOLEAN:
                    configElement = makeToggleSwitch(config, setTempState, exampleToggle);
                    break;

                case Config.ConfigTypeEnum.COLOR:
                    configElement = makeColorPicker(config, setTempState);
                    break;

                case Config.ConfigTypeEnum.DROPDOWN:
                    configElement = makeDropdownMenu(config, setTempState);
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
                    config: config
                });
            }
        }
        catch (e) {
            plugin.log(e.stack, BetterMixer.LogType.ERROR);
        }
    }

    // Save
    settingsDialogElement.querySelector('button[data-variant="primary"]').addEventListener('click', e => {
        for (const configData of configsData) {
            if (configData.element.tempState !== undefined) {
                configData.config.state = configData.element.tempState;
            }
        }
        plugin.configuration.saveConfig();
        plugin.configuration.updateConfig();
        plugin.log("Updated configurations.");
    });
};

const makeToggleSwitch = (config, setTempState, example) => {
    const element = example.cloneNode(true);
    element.children[2].textContent = config.displayText;

    if (config.state !== element.classList.contains('checked_37Lzx')) {
        element.classList.toggle('checked_37Lzx');
    }
    element.getElementsByTagName("input")[0].addEventListener('click', e => {
        element.classList.toggle('checked_37Lzx');
        setTempState(element.classList.contains('checked_37Lzx'));
        config.updateImmediate(element.tempState);
    });

    return element;
};

const makeColorPicker = (config, setTempState) => {
    const colorHolder = document.createElement('div');
    const colorLengths = [3, 4, 6, 8];

    ReactDOM.render(React.createElement(mixerUi.SimpleColorPicker, {
        label: config.displayText,
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

    return colorHolder.children[0];
};

const makeDropdownMenu = (config, setTempState) => {
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

    return dropdownHolder.children[0];
};

const makeStringInput = (config, setTempState) => {
    const stringInputHolder = document.createElement('div');

    ReactDOM.render(React.createElement(mixerUi.BuiTextInput, {
        label: config.displayText
    }), stringInputHolder);

    const input = stringInputHolder.querySelector('input');
    input.value = config.state;
    input.addEventListener('change', e => {
        setTempState(input.value);
    });

    return stringInputHolder.children[0];
};