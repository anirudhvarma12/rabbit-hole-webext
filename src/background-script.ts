import { v4 as uuidv4 } from "uuid";
import { Message, MessageType } from "./messages";
import { DEFAULT_STORE, Link, Store } from "./models";
import {
  createSession,
  findOrCreatePage,
  findSessionById,
  getLinksForSession,
} from "./store-helper";

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

// Map to store session id against a tab id.
const tabSessionId: Record<number, number> = {};
// Map to strore the previous url that the user is navigating from against a tab id.
const sourceUrls: Record<number, string> = {};
// Maps the transition type against a tab id.
const transitionTypes: Record<number, string> = {};
// Maps the transition qualifiers (forward_back) against a tab id.
const transitionQualifiers: Record<
  number,
  browser.webNavigation.TransitionQualifier[]
> = {};

const filter: browser.webNavigation.EventUrlFilters = {
  url: [{ urlContains: "https" }, { urlContains: "http" }],
};

export const getStore = async (): Promise<Store> => {
  const store = await browser.storage.local.get();
  if (store == null || store == undefined) {
    return DEFAULT_STORE;
  }
  return store as Store;
};

const isUserGoingForwardOrBack = (tabId: number): boolean => {
  const qualifiers = transitionQualifiers[tabId] ?? [];
  if (qualifiers.length == 0) {
    return false;
  }
  return qualifiers.includes("forward_back");
};

async function onDomLoaded(details: NavigationDetail) {
  if (isUserGoingForwardOrBack(details.tabId)) {
    return;
  }
  const currentTab = await browser.tabs.get(details.tabId);
  const currentTitle = currentTab.title;
  const store = await getStore();
  const sessions = store.sessions || [];
  const links = store.links || [];
  const pages = store.pages || [];
  const existingSessionForTab = tabSessionId[details.tabId];
  let session;
  if (
    !existingSessionForTab ||
    (transitionTypes[details.tabId] != "reload" &&
      transitionTypes[details.tabId] != "link")
  ) {
    session = createSession();
    session.name = currentTitle;
    sessions.push(session);
    tabSessionId[details.tabId] = session.id;
  } else {
    session = findSessionById(sessions, existingSessionForTab);
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
    timestamp: Date.now(),
    id: uuidv4(),
  };
  sourceUrls[details.tabId] = details.url;
  links.push(link);
  browser.storage.local.set({ sessions, pages, links });
}

/**
 * Listen to onCommit because we get transition type and qualifier here.
 */
browser.webNavigation.onCommitted.addListener((details) => {
  transitionTypes[details.tabId] = details.transitionType;
  transitionQualifiers[details.tabId] = details.transitionQualifiers;
}, filter);

/**
 * Listening to onDOMContentLoaded means that we do not have to do extra effort
 * to get page title
 */
browser.webNavigation.onDOMContentLoaded.addListener(onDomLoaded, filter);

/**
 * Provides the source URL/tab id when the user opens a link in the new tab.
 */
browser.webNavigation.onCreatedNavigationTarget.addListener(async (details) => {
  // If the user opens in a new tab, sourceTabId maintains the session.
  if (details.sourceTabId != -1) {
    tabSessionId[details.tabId] = tabSessionId[details.sourceTabId];
    const sourceTab = await browser.tabs.get(details.sourceTabId);
    sourceUrls[details.tabId] = sourceTab.url;
  } else {
    sourceUrls[details.tabId] = details.url;
  }
}, filter);

browser.webNavigation.onBeforeNavigate.addListener(async (details) => {
  const currentTab = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!sourceUrls[details.tabId]) {
    sourceUrls[details.tabId] = currentTab[0]?.url;
  }
}, filter);

browser.browserAction.onClicked.addListener(() => {
  browser.sidebarAction.open();
});

//Event Listeners for extension page
browser.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    if (message.type == MessageType.GET_SESSIONS) {
      getStore().then((store) => {
        sendResponse(store.sessions);
      });
      return true;
    } else if (message.type == MessageType.GET_LINKS_AND_PAGES) {
      const sessionid = message.payload;
      getStore().then((store) => {
        const links = getLinksForSession(store.links, sessionid);
        const pages = store.pages.filter((page) => {
          const linkIndex = links.findIndex(
            (l) => l.source_url == page.url || l.target_url == page.url
          );
          return linkIndex != -1;
        });
        sendResponse({ links, pages });
      });
      return true;
    } else if (message.type === MessageType.GET_LINK) {
      getStore().then((store) => {
        const links = store.links;
        // search across both timestamp and ids for older implementations
        const link = links.find(
          (l) => l.id == message.payload || l.timestamp == message.payload
        );
        sendResponse(link);
      });
      return true;
    } else if (message.type === MessageType.SAVE_LINK) {
      getStore().then((store) => {
        const links = [...store.links];
        const { id, description, label } = message.payload;
        const linkIndex = links.findIndex(
          (l) => l.id === id || l.timestamp === id
        );
        if (linkIndex != -1) {
          links[linkIndex].notes = description;
          links[linkIndex].label = label;
          browser.storage.local.set({ links });
          sendResponse(links[linkIndex]);
        }
      });
      return true;
    } else if (message.type === MessageType.DELETE_SESSION) {
      getStore().then((store) => {
        const sessions = store.sessions.filter(
          (session) => session.id !== message.payload
        );
        const links = store.links.filter(
          (link) => link.session !== message.payload
        );
        browser.storage.local.set({ sessions, links });
        return true;
      });
    }
  }
);
