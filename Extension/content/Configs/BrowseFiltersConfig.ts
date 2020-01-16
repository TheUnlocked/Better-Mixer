import Config from "./Config.js";

export default class BrowseFiltersConfig extends Config<string> {
    queryParams: string;

    constructor() {
        super();
        this.queryParams = "";
    }

    // The name used internally
    get configName() {
        return "browse_filters";
    }

    // Set the config state
    set state(state) {
        this.queryParams = state;
    }

    // Get the config state
    get state() {
        return this.queryParams;
    }

    // The state to be held before the config is modified
    get defaultState() {
        return "";
    }

    // The type of config, currently unused as configs can only be booleans
    get configType() {
        return Config.ConfigTypeEnum.NONE;
    }
}