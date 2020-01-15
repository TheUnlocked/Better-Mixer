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

// `unknown` is used for currently unimplemented events.

export type LoadEvent = BetterMixerEvent<LoadEventData>;
export type LoadEventData = unknown;

export type ChannelLoadEvent = BetterMixerEvent<ChannelLoadEventData>;
export type ChannelLoadEventData = unknown;

export type ChatStartLoadEvent = BetterMixerEvent<ChatStartLoadEventData>;
export type ChatStartLoadEventData = Chat;

export type ChatFinishLoadEvent = BetterMixerEvent<ChatFinishLoadEventData>;
export type ChatFinishLoadEventData = Chat;

export type UserLoadEvent = BetterMixerEvent<UserLoadEventData>;
export type UserLoadEventData = unknown;

export type ChatMessageEvent = BetterMixerEvent<ChatMessageEventData>;
export type ChatMessageEventData = ChatMessage;

export type EmotesDialogOpenEvent = BetterMixerEvent<EmotesDialogOpenEventData>;
export type EmotesDialogOpenEventData = {
    chat: Chat;
    dialog: HTMLElement;
};

export type SettingsDialogOpenEvent = BetterMixerEvent<SettingsDialogOpenEventData>;
export type SettingsDialogOpenEventData = {
    dialog: HTMLElement;
};

export type PageLoadEvent = BetterMixerEvent<PageLoadEventData>;
export type PageLoadEventData = unknown;

export type EmotesAddedEvent = BetterMixerEvent<EmotesAddedEventData>;
export type EmotesAddedEventData = EmoteSet[];

export type GatherEmotesEvent = BetterMixerEvent<GatherEmotesEventData>;
export type GatherEmotesEventData = {
    user: User;
    message: ChatMessage;
    channel: Channel;
};
export type GatherEmotesResult = Emote | Emote[] | EmoteSet;

export type GatherBadgesEvent = BetterMixerEvent<GatherBadgesEventData>;
export type GatherBadgesEventData = {
    user: User;
    message: ChatMessage;
    channel: Channel;
};
export type GatherBadgesResult = Badge | Badge[] | undefined;