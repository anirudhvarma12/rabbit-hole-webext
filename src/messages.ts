export interface Message {
  type: MessageType;
  payload?: any;
}

export enum MessageType {
  GET_SESSIONS,
  GET_LINKS_AND_PAGES,
  GET_LINK,
  SAVE_LINK,
  DELETE_SESSION,
  START_RECORDING,
  STOP_RECORDING,
  TAB_CHANGED,
}
