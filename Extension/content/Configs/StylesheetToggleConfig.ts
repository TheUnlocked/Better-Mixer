import Config from "./Config.js";

export default class StylesheetToggleConfig extends Config<boolean> {
    private _element: HTMLLinkElement;
    private _configName: string;
    private _displayText: string;
    private _descriptionText: string;
    private _defaultState: boolean;
    private _enabledState: boolean;
    private _state: boolean;

    constructor(element: HTMLLinkElement, configName: string, displayText: string, descriptionText = "", defaultState = false, enabledState = true) {
        super();

        this._element = element;
        this._configName = configName;
        this._displayText = displayText;
        this._descriptionText = descriptionText;
        this._defaultState = defaultState;
        this._enabledState = enabledState;
        this._state = defaultState;
    }

    // The name used internally
    get configName() {
        return this._configName;
    }

    // The name seen in the settings menu
    get displayText() {
        return this._displayText;
    }

    // A currently unused property explaining the config
    get descriptionText() {
        return this._descriptionText;
    }

    // Set the config state
    set state(state) {
        this._state = state;
    }

    // Get the config state
    get state() {
        return this._state;
    }

    // The state to be held before the config is modified
    get defaultState() {
        return this._defaultState;
    }

    // Updates the configuration effect
    update() {
        this._element.disabled = this._state !== this._enabledState;
    }

    // The type of config, currently unused as configs can only be booleans
    get configType() {
        return Config.ConfigTypeEnum.BOOLEAN;
    }
}