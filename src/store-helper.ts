import { Link, Session, Id, Page } from "./models";

/**
 * Finds the latest Link where the given URL is the target and returns the session for that.
 *
 *
 * @param url
 * @param sessions
 * @param links
 */
export const findSession = (url: string, sessions: Session[] = [], links: Link[] = []): Session | undefined => {
  const latestLinkForUrl = links.find((l) => l.target_url == url);
  if (!latestLinkForUrl) {
    return;
  }
  return sessions.find((session) => {
    return session.id == latestLinkForUrl.session;
  });
};

export const createSession = (): Session => {
  // Just keeping id and time different fields for sanity
  const id = Date.now();
  const time = id;
  return { id, time };
};

export const findOrCreateSessionForPage = (
  url: string,
  sessions: Session[] = [],
  links: Link[] = []
): { session: Session; added: boolean } => {
  const session = findSession(url, sessions, links);
  if (session) {
    return { session, added: false };
  }
  return { session: createSession(), added: true };
};

export const getLinksForSession = (links: Link[], session: Id) => {
  return links.filter((link) => link.session == session).sort((link1, link2) => link1.timestamp - link2.timestamp);
};

export const findLatestLink = (links: Link[]) => {
  if (links.length == 0) {
    return;
  }
  return links[links.length - 1];
};

export const findOrCreatePage = (url: string, title: string, pages: Page[]): { page: Page; added: boolean } => {
  const page = pages.find((p) => p.url == url);
  if (page) {
    return { page, added: false };
  }
  const newPage: Page = { url, title };
  return { page: newPage, added: true };
};

export const findSessionById = (sessions: Session[], id: Id) => {
  return sessions.find((s) => s.id === id);
};
