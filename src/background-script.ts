import { Link, Store } from "./models";
import { createSession, findLatestLink, findOrCreatePage, findSessionById, getLinksForSession } from "./store-helper";

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
const sourceUrls: Record<number, string> = {};

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
  let session;
  if (!existinSessionForTab || (details.transitionType != "reload" && details.transitionType != "link")) {
    session = createSession();
    sessions.push(session);
    tabSessionId[details.tabId] = session.id;
  } else {
    session = findSessionById(sessions, existinSessionForTab);
  }
  const pageInfo = findOrCreatePage(details.url, currentTitle, pages);
  if (pageInfo.added) {
    pages.push(pageInfo.page);
  }
  console.log("Source URL", sourceUrls[details.tabId], "target", details.url);
  const link: Link = {
    session: session.id,
    source_url: sourceUrls[details.tabId],
    target_url: details.url,
    timestamp: Date.now()
  };
  sourceUrls[details.tabId] = details.url;
  links.push(link);
  browser.storage.local.set({ sessions, pages, links });
}

const filter: browser.webNavigation.EventUrlFilters = { url: [{ hostContains: ".wikipedia" }] };
browser.webNavigation.onCommitted.addListener(onDomLoaded, filter);
browser.webNavigation.onCreatedNavigationTarget.addListener(async details => {
  // If the user opens in a new tab, sourceTabId maintains the session.
  if (details.sourceTabId != -1) {
    tabSessionId[details.tabId] = tabSessionId[details.sourceTabId];
    const sourceTab = await browser.tabs.get(details.sourceTabId);
    sourceUrls[details.tabId] = sourceTab.url;
  } else {
    sourceUrls[details.tabId] = details.url;
  }
});
browser.webNavigation.onBeforeNavigate.addListener(async details => {
  const currentTab = await browser.tabs.query({ active: true, currentWindow: true });
  if (!sourceUrls[details.tabId]) {
    sourceUrls[details.tabId] = currentTab[0]?.url;
  }
}, filter);
browser.storage.onChanged.addListener((changes, areaName) => {
  console.log(changes?.links?.newValue);
});
