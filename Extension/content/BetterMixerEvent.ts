import User from "./User.js";
import Channel from "./Channel.js";
import ChatMessage from "./ChatMessage.js";
import Badge from "./Badge.js";
import Chat from "./Chat.js";
import EmoteSet from "./EmoteSet.js";
import Emote from "./Emote.js";

export interface BetterMixerEvent<EventData> {
    event: string;
    sender: any;
    data: EventData;
}

export type LoadEvent = BetterMixerEvent<LoadEventData>;
export type BeforeChannelLoadEvent = BetterMixerEvent<BeforeChannelLoadEventData>;
export type ChannelLoadEvent = BetterMixerEvent<ChannelLoadEventData>;
export type ChatStartLoadEvent = BetterMixerEvent<ChatStartLoadEventData>;
export type ChatFinishLoadEvent = BetterMixerEvent<ChatFinishLoadEventData>;
export type UserLoadEvent = BetterMixerEvent<UserLoadEventData>;
export type ChatMessageEvent = BetterMixerEvent<ChatMessageEventData>;
export type EmotesDialogOpenEvent = BetterMixerEvent<EmotesDialogOpenEventData>;
export type SettingsDialogOpenEvent = BetterMixerEvent<SettingsDialogOpenEventData>;
export type PageLoadEvent = BetterMixerEvent<PageLoadEventData>;
export type EmotesAddedEvent = BetterMixerEvent<EmotesAddedEventData>;
export type GatherEmotesEvent = BetterMixerEvent<GatherEmotesEventData>;
export type GatherBadgesEvent = BetterMixerEvent<GatherBadgesEventData>;

// `unknown` is used for currently unimplemented events.
export type LoadEventData = unknown;
export type BeforeChannelLoadEventData = Channel;
export type ChannelLoadEventData = Channel;
export type ChatStartLoadEventData = Chat;
export type ChatFinishLoadEventData = Chat;
export type UserLoadEventData = unknown;
export type ChatMessageEventData = ChatMessage;
export type EmotesDialogOpenEventData = {
    chat: Chat;
    dialog: HTMLElement;
};
export type SettingsDialogOpenEventData = {
    dialog: HTMLElement;
};
export type PageLoadEventData = unknown;
export type EmotesAddedEventData = EmoteSet[];

export type GatherEmotesEventData = {
    channel: Channel;
    user: User;
    message: ChatMessage | null;
};
export type GatherEmotesResult = Emote[] | EmoteSet;

export type GatherBadgesEventData = {
    channel: Channel;
    user: User;
    message: ChatMessage | null;
};
export type GatherBadgesResult = Badge[];

export interface EventMap {
    'load': LoadEventData;
    'beforeChannelLoad': ChannelLoadEventData;
    'channelLoad': ChannelLoadEventData;
    'chatStartLoad': ChatStartLoadEventData;
    'chatFinishLoad': ChatFinishLoadEventData;
    'userLoad': UserLoadEventData;
    'chatMessage': ChatMessageEventData;
    'emotesDialogOpen': EmotesDialogOpenEventData;
    'settingsDialogOpen': SettingsDialogOpenEventData;
    'pageLoad': PageLoadEventData;
    'emotesAdded': EmotesAddedEventData;
}

export interface GatherMap {
    'gatherEmotes': [GatherEmotesEventData, GatherEmotesResult];
    'gatherBadges': [GatherBadgesEventData, GatherBadgesResult];
}