import Config from "./Config.js";
import { ChannelAudienceRating, ChannelLanguage } from "../Constants.js";

export default class BrowseFiltersConfig extends Config {
    constructor() {
        super();

        this.queryParams = "";

        // this.mixplayGames = false;
        // this.mixplayShareController = false;
        // this.mixplayOther = false;

        // this.channelAudience = ChannelAudienceRating.NONE;
        // this.channelLanguage = ChannelLanguage.NONE;
        // this.channelPartners = false;

        // this.featuresCostream = false;
        // this.featuresFtl = false;
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
        
        // return {
        //     mixplay: {
        //         games: this.mixplayGames,
        //         share_controller: this.mixplayShareController,
        //         other: this.mixplayOther
        //     },
        //     channel: {
        //         audience: this.channelAudience,
        //         language: this.channelLanguage,
        //         partners: this.channelPartners
        //     },
        //     features: {
        //         costream: this.featuresCostream,
        //         ftl: this.featuresFtl
        //     }
        // };
    }

    // The state to be held before the config is modified
    get defaultState() {

        return "";

        // return {
        //     mixplay: {
        //         games: false,
        //         share_controller: false,
        //         other: false
        //     },
        //     channel: {
        //         audience: ChannelAudienceRating.NONE,
        //         language: ChannelLanguage.NONE,
        //         partners: false
        //     },
        //     features: {
        //         costream: false,
        //         ftl: false
        //     }
        // };
    }

    // Updates the configuration effect
    update() {
        
    }

    // The type of config, currently unused as configs can only be booleans
    get configType() {
        return Config.ConfigTypeEnum.NONE;
    }
}