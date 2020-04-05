export type Id = number;
export type Timestamp = number;

export enum TransitionType {
  OTHERS,
  LINK,
  RELOAD,
}

export interface Session {
  id: Id;
  time: Timestamp;
  name?: string;
}

export interface Page {
  title: string;
  url: string;
}

export interface Link {
  session: Id;
  source_url: string;
  target_url: string;
  timestamp: Timestamp;
  notes?: string;
  id: string;
}

export interface Store {
  pages: Page[];
  sessions: Session[];
  links: Link[];
}

export const DEFAULT_STORE: Store = {
  pages: [],
  sessions: [],
  links: [],
};

export interface ExpandedLink extends Link {
  target_title: string;
  source_title?: string;
}
