import { Link, Session } from "./models";

/**
 * Finds the latest Link where the given URL is the target and returns the session for that.
 *
 *
 * @param url
 * @param sessions
 * @param links
 */
export const findSession = (url: string, sessions: Session[] = [], links: Link[] = []): Session | undefined => {
  const latestLinkForUrl = links.find(l => l.target_url == url);
  if (!latestLinkForUrl) {
    return;
  }
  return sessions.find(session => {
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
