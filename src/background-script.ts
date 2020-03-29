import { Link, Store } from "./models";
import {
  findLatestLink,
  findOrCreatePage,
  findOrCreateSessionForPage,
  getLinksForSession,
  createSession,
  findSession,
  findSessionById
} from "./store-helper";

//TODO Remove params and fragments

export type BrowserTransitionType = browser.webNavigation.TransitionType;

interface NavigationDetail {
  tabId: number;
  url: string;
  processId?: number;
  sourceTabId?: number;
  transitionType?: browser.webNavigation.TransitionType;
  transitionQualifiers?: browser.webNavigation.TransitionQualifier[];
  timeStamp: number;
}

export const PAGE_LIST = "pages";
export const LINK_LIST = "links";
export const SESSION_LIST = "sessions";

const tabSessionId: Record<number, number> = {};

export const getStore = async (): Promise<Store> => {
  const store = await browser.storage.local.get();
  return store as Store;
};

async function onDomLoaded(details: NavigationDetail) {
  const currentTab = await browser.tabs.get(details.tabId);
  const currentTitle = currentTab.title;
  const store = await getStore();
  const sessions = store.sessions || [];
  const links = store.links || [];
  const pages = store.pages || [];
  const existinSessionForTab = tabSessionId[details.tabId];
  let lastPage = undefined;
  let session;
  if (!existinSessionForTab || (details.transitionType != "reload" && details.transitionType != "link")) {
    session = createSession();
    sessions.push(session);
    tabSessionId[details.tabId] = session.id;
    console.log("Not reusing session", details.transitionType, existinSessionForTab);
  } else {
    session = findSessionById(sessions, existinSessionForTab);
    const sessionLinks = getLinksForSession(links, existinSessionForTab);
    lastPage = findLatestLink(sessionLinks);
    console.log("reusing session", session.id);
  }
  const pageInfo = findOrCreatePage(details.url, currentTitle, pages);
  if (pageInfo.added) {
    pages.push(pageInfo.page);
  }
  const link: Link = {
    session: session.id,
    source_url: lastPage?.target_url,
    target_url: details.url,
    timestamp: Date.now()
  };
  links.push(link);
  browser.storage.local.set({ sessions, pages, links });
}

const filter: browser.webNavigation.EventUrlFilters = { url: [{ hostContains: ".wikipedia" }] };
browser.webNavigation.onCommitted.addListener(onDomLoaded, filter);
browser.webNavigation.onCreatedNavigationTarget.addListener(details => {
  // If the user opens in a new tab, sourceTabId maintains the session.
  if (details.sourceTabId != -1) {
    tabSessionId[details.tabId] = tabSessionId[details.sourceTabId];
  }
});
browser.storage.onChanged.addListener((changes, areaName) => {
  // console.log(changes, areaName);
});
