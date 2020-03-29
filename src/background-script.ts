import { Link, Store, DEFAULT_STORE } from "./models";
import { createSession, findLatestLink, findOrCreatePage, findSessionById, getLinksForSession } from "./store-helper";
import { Message, MessageType } from "./messages";

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
const transitionTypes: Record<number, string> = {};

export const getStore = async (): Promise<Store> => {
  const store = await browser.storage.local.get();
  if (store == null || store == undefined) {
    return DEFAULT_STORE;
  }
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
  if (
    !existinSessionForTab ||
    (transitionTypes[details.tabId] != "reload" && transitionTypes[details.tabId] != "link")
  ) {
    session = createSession();
    session.name = currentTitle;
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
browser.webNavigation.onCommitted.addListener(details => {
  transitionTypes[details.tabId] = details.transitionType;
}, filter);
browser.webNavigation.onDOMContentLoaded.addListener(onDomLoaded, filter);
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
browser.browserAction.onClicked.addListener(() => {
  const data = {
    url: "viewer.html"
  };
  browser.tabs.create(data);
});

//Event Listeners for extension page
browser.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (message.type == MessageType.GET_SESSIONS) {
    getStore().then(store => {
      sendResponse(store.sessions);
    });
    return true;
  } else if (message.type == MessageType.GET_LINKS_AND_PAGES) {
    const sessionid = message.payload;
    getStore().then(store => {
      const links = getLinksForSession(store.links, sessionid);
      const pages = store.pages.filter(page => {
        const linkIndex = links.findIndex(l => l.source_url == page.url || l.target_url == page.url);
        return linkIndex != -1;
      });
      sendResponse({ links, pages });
    });
    return true;
  }
});
