import Config from "./Config.js";

export default class EmptyConfig<T> extends Config<T> {
    _name: string;
    _state: T;
    _default: T;

    constructor(name: string, defaultValue: T) {
        super();
        this._name = name;
        this._default = defaultValue;
        this._state = defaultValue;
    }

    // The name used internally
    get configName() {
        return this._name;
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
        return this._default;
    }

    // The type of config, currently unused as configs can only be booleans
    get configType() {
        return Config.ConfigTypeEnum.NONE;
    }
}