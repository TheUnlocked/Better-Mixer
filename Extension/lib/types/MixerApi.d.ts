type uint = number;
type integer = number;
/**
 * A universally unique identifier (UUID).

 * Example:
 * `4825bcf1-9640-4d91-bf66-426731cfa717`
 */

declare type UUID = string;
/**
 * An ISO8601 date string.

 * Example:
 * `2016-06-28T04:25:45.110Z`
 */
declare type IsoDate = string;

/** Resources are general use items that are stored and linked to other entities within Mixer.They usually represent images or backgrounds for a channel or user. */
declare interface MixerResource {    
    /** The unique ID of the resource. */
	id: uint;
	/** The type of the resource. */
	type: string;
	/** Id linking to the parent object. */
	relid: uint;
	/** The url of the resource. */
	url: string;
	/** The storage type of the resource. */
	store: 's3';
	/** Relative url to the resource. */
	remotePath: string;
	/** Additional resource information. */
	meta?: object;
}

/** Base game type. */
declare interface MixerGameTypeSimple {
    /** The unique ID of the game type. */
	id: uint;
	/** The name of the type. */
	name: string;
	/** The url to the type's cover. */
	coverUrl?: string;
	/** The url to the type's background. */
	backgroundUrl?: string;
}

/** A GameType can be set on a channel and represents the title they are broadcasting. */
declare interface MixerGameType extends MixerGameTypeSimple {
    /** The name of the parent type. */
	parent: string;
	/** The description of the type. */
	description: string;
	/** The source where the type has been imported from. */
	source: string;
	/** Total amount of users watching this type of stream. */
	viewersCurrent: uint;
	/** Amount of streams online with this type. */
	online: uint;
}

/** The social information for a channel. */
declare interface MixerSocialInfo {
    /** Twitter profile URL. */
	twitter: string;
	/** Facebook profile URL. */
	facebook: string;
	/** Youtube profile URL. */
	youtube: string;
	/** Player.me profile URL. */
	player: string;
	/** Discord username and tag. */
	discord: string;
	/** A list of social keys which have been verified via linking the Mixer account with the account on the corresponding external service. */
	verified: string[];
}

/** A type that contains information about creation, update and deletion dates. */
declare interface MixerTimeStamped {
    /** The creation date of the channel. */
	createdAt: IsoDate;
	/** The update date of the channel. */
	updatedAt: IsoDate;
	/** The deletion date of the channel. */
	deletedAt?: IsoDate;
}

/**
 * Available roles are:
 * * `User` - A regular user. All Users have this.
 * * `Banned` - A user who has been banned from the channel will have this role.
 * * `Pro` - A user who has an active Mixer Pro subscription will have this role.
 * * `VerifiedPartner` - A channel who is marked as Verified but does not have a Subscribe button will have this role.
 * * `Partner` - A channel that has a Subscribe button will have this role.
 * * `Subscriber` - A user who has an active subscription for the partnered channel involved in this request will have this role.
 * * `ChannelEditor` - A user marked as a Channel Editor will be able to change that channel's title, game, and other channel properties.
 * * `Mod` - A user will have this role if they are a moderator in the channel involved in this request.
 * * `GlobalMod` - A user will have this role if they are a global moderator on Mixer.
 * * `Staff` - A User will have this role if they are Mixer Staff.
 * * `Founder` - A User will have this role if they are a Mixer Founder.
 * * `Owner` - A user will have this role if they are the owner of the channel involved in this request.
 */
declare type MixerRole = 'User' | 'Banned' | 'Pro' | 'VerifiedPartner' | 'Partner' | 'Subscriber' | 'ChannelEditor' | 'Mod' | 'GlobalMod' | 'Staff' | 'Founder' | 'Owner';

declare interface MixerUserGroup extends MixerTimeStamped {
    /** The unique ID of the group. */
	id: uint;
	/** The name of the group. */
	name: MixerRole;
}

/** A user is a person on Mixer; they can sign in and interact with the site. Each user owns a channel, which they can broadcast to. */
declare interface MixerUser extends MixerTimeStamped {
    /** The unique ID of the user. */
	id: uint;
	/** The user's current level on Mixer, as determined by the number of experience points the user has. */
	level: uint;
	/** Social links. */
	social?: MixerSocialInfo;
	/** 
     * The user's name. This is unique on the site and is also their channel name.
     * * minLength: 1
     * * maxLength: 20
     */
	username: string;
	/**
     * The user's email address. This is only shown if apropriate permissions are present.
     * * maxLength: 190
     */
	email?: string;
	/** Indicates whether the user has verified their e-mail. */
	verified: boolean;
	/** The user's experience points. */
	experience: uint;
	/** The amount of sparks the user has. */
	sparks: uint;
	/** The user's profile URL. */
	avatarUrl?: string;
	/** The user's biography. This may contain HTML. */
	bio?: string;
	/** The ID of user's main team. */
	primaryTeam?: uint;
}

/** A User object with an embedded array of groups they belong to. */
declare interface MixerUserWithGroups extends MixerUser {
    /** The groups of the user. */
    groups: MixerUserGroup[];
}

/** A single channel within Mixer. Each channel is owned by a user, and a channel can be broadcasted to. */
declare interface MixerChannel extends MixerTimeStamped {
    /** The unique ID of the channel. */
    id: uint;
    /** The ID of the user owning the channel. */
    userId: uint;
    /** The name and url of the channel. */
    token: string;
    /** Indicates if the channel is streaming. */
    online: boolean;
    /** True if featureLevel is > 0. */
    featured: boolean;
    /** The featured level for this channel. Its value controls the position and order of channels in the featured carousel. */
    featureLevel: integer | -1;
    /** Indicates if the channel is partnered. */
    partnered: boolean;
    /** The id of the transcoding profile. */
    transcodingProfileId?: uint;
    /** Indicates if the channel is suspended. */
    suspended: boolean;
    /** The title of the channel. */
    name: string;
    /** The target audience of the channel. */
    audience: 'family' | 'teen' | '18+';
    /** Amount of unique viewers that ever viewed this channel. */
    viewersTotal: uint;
    /** Amount of current viewers. */
    viewersCurrent: uint;
    /** Amount of followers. */
    numFollowers: uint;
    /** The description of the channel, can contain HTML. */
    description: string;
    /** The ID of the game type. */
    typeId?: uint;
    /** Indicates if that channel is interactive. */
    interactive: boolean;
    /** The ID of the interactive game used. */
    interactiveGameId?: uint;
    /** The ftl stream id. */
    ftl: uint;
    /** Indicates if the channel has vod saved. */
    hasVod: boolean;
    /** ISO 639 language id. */
    languageId?: string;
    /** The ID of the cover resource. */
    coverId?: uint;
    /** The resource ID of the thumbnail. */
    thumbnailId?: uint;
    /** The resource ID of the subscriber badge. */
    badgeId: uint;
    /** The URL of the the banner image. */
    bannerUrl: string;
    /** The ID of the hostee channel. */
    hosteeId: uint;
    /** Indicates if the channel has transcodes enabled. */
    hasTranscodes: boolean;
    /** Indicates if the channel has vod recording enabled. */
    vodsEnabled: boolean;
    /** The costream that the channel is in, if any. */
    costreamId?: UUID;
}

/** Augmented regular channel with additional data. */
declare interface MixerChannelAdvanced extends MixerChannel {
    /** A nested type showing information about this channel's currently selected type. */
	type?: MixerGameType;
	/** This channel's owner */
	user: MixerUserWithGroups;
}

/** Channel preferences are a list of options and attributes which control behaviour for the channel. Please see each property for more details. */
declare interface ChannelPreferences {
    /** The text used when sharing the stream. The template parameter %URL% will be replaced with the channel's URL. The template parameter %USER% will be replaced with the channel's name. */
	sharetext?: string;
	/** Specifies whether links are allowed in the chat. */
	'channel:links:allowed'?: boolean;
	/** Specifies whether links are clickable in the chat. */
	'channel:links:clickable'?: boolean;
	/** Interval required between each chat message. */
	'channel:slowchat'?: number;
	/** The message to be sent when a user completes a direct purchase on the channel. The template parameter %USER% will be replaced with the name of the user who completed direct purchase. The template parameter %CHANNEL% will be replaced with the name of the channel. The template parameter %GAMETITLE% will be replaced with the name of the game purchased. */
	'channel:notify:directPurchaseMessage'?: string;
	/** The message to be sent when a user subscribes to the channel. The template parameter %USER% will be replaced with the subscriber's name. */
	'channel:notify:subscribemessage'?: string;
	/** Indicates whether a notification should be shown upon subscription. */
	'channel:notify:subscribe'?: boolean;
	/** The message to be sent when a user follows the channel. The template parameter "%USER%" will be replaced with the follower's name. */
	'channel:notify:followmessage'?: string;
	/** Indicates whether a notification should be shown upon follow. */
	'channel:notify:follow'?: boolean;
	/** The message to be sent when a user hosts the channel. The template parameter "%USER%" will be replaced with the hoster's name. */
	'channel:notify:hostedBy'?: string;
	/** The message to be sent when the channel hosts another. The template parameter "%USER%" will be replaced with the hostee's name. */
	'channel:notify:hosting'?: string;
	/** The text to be added to the subscription email. */
	'channel:partner:submail'?: string;
	/** Indicates whether to mute when the streamer opens his own stream. */
	'channel:player:muteOwn'?: boolean;
	/** Indicates whether the tweet button should be shown. */
	'channel:tweet:enabled'?: boolean;
	/** The message to be used when a user tweets about the channel. The template parameter %URL% will be replaced with the share url. */
	'channel:tweet:body'?: string;
	/** Indicates if the channel allows HypeZone to host it. */
	'hypezone:allow': boolean;
	/** Indicates if the channel allows other channels to host it. */
	'hosting:allow': boolean;
	/** Allows other streamers to join you in a costream. */
	'costream:allow': boolean;
	/** When a user visits the channel while the channel is offline, the most recent VOD will be automatically played if this preference is enabled. */
	'channel:offline:autoplayVod'?: boolean;
}

/** Augmented ChannelAdvanced with additional properties. */
declare interface MixerExpandedChannel extends MixerChannelAdvanced {
    /** A resource object representing the thumbnail. */
	thumbnail?: MixerResource;
	/** A resource object representing the cover. */
	cover?: MixerResource;
	/** A resource object representing the badge. */
	badge?: MixerResource;
	/** Unused, deprecated. */
	cache: object[];
	/** The channel preferences. */
	preferences: ChannelPreferences;
}