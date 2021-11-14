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

const tabsWithActiveRecording: number[] = [];
// Map to store session id against a tab id.
const tabSessionId = new Map<number, number>();
// Map to store the previous url that the user is navigating from against a tab id.
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
  console.log(
    "DOM Active Recording",
    details.tabId,
    tabsWithActiveRecording.includes(details.tabId)
  );
  if (
    isUserGoingForwardOrBack(details.tabId) ||
    !tabsWithActiveRecording.includes(details.tabId)
  ) {
    return;
  }
  await createSessionForTabAndURL(details.tabId, details.url);
}

async function createSessionForTabAndURL(tabId: number, url: string) {
  const currentTab = await browser.tabs.get(tabId);
  const currentTitle = currentTab.title;
  const store = await getStore();
  const sessions = store.sessions || [];
  const links = store.links || [];
  const pages = store.pages || [];
  const existingSessionForTab = tabSessionId.get(tabId);
  let session;
  if (
    !existingSessionForTab ||
    (transitionTypes[tabId] != "reload" && transitionTypes[tabId] != "link")
  ) {
    session = createSession();
    session.name = currentTitle;
    sessions.push(session);
    tabSessionId.set(tabId, session.id);
  } else {
    session = findSessionById(sessions, existingSessionForTab);
  }
  const pageInfo = findOrCreatePage(url, currentTitle, pages);
  if (pageInfo.added) {
    pages.push(pageInfo.page);
  }
  console.log("Source URL", sourceUrls[tabId], "target", url);
  const link: Link = {
    session: session.id,
    source_url: sourceUrls[tabId],
    target_url: url,
    timestamp: Date.now(),
    id: uuidv4(),
  };
  sourceUrls[tabId] = url;
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
    tabSessionId.set(details.tabId, tabSessionId.get(details.sourceTabId));
    const sourceTab = await browser.tabs.get(details.sourceTabId);
    console.log(
      `Opening in new tab`,
      details.tabId,
      "from source tab",
      details.sourceTabId
    );
    tabsWithActiveRecording.push(details.tabId);
    sourceUrls[details.tabId] = sourceTab.url;
  } else {
    sourceUrls[details.tabId] = details.url;
  }
}, filter);

function notifyTabStatusChanged(tabId: number) {
  browser.runtime.sendMessage({
    type: MessageType.TAB_CHANGED,
    payload: {
      activeSession: tabsWithActiveRecording.includes(tabId),
    },
  });
}

browser.tabs.onActivated.addListener((details) => {
  notifyTabStatusChanged(details.tabId);
});

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
        sendResponse(true);
      });
      return true;
    } else if (message.type === MessageType.START_RECORDING) {
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs.length) {
          const firstTab = tabs[0];
          tabsWithActiveRecording.push(firstTab.id);
          createSessionForTabAndURL(firstTab.id, firstTab.url);
          notifyTabStatusChanged(firstTab.id);
          sendResponse(true);
        } else {
          console.warn("No active tabs found when trying to start recording");
          sendResponse(false);
        }
      });
      return true;
    } else if (message.type === MessageType.STOP_RECORDING) {
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs.length) {
          const firstTab = tabs[0];
          // To Stop recording of a session,
          // we first get the active tabs for the session
          const targetSessionId = tabSessionId.get(firstTab.id);
          // remove all tabs recording the same session
          for (let entry of tabSessionId.entries()) {
            const [tabId, sessionId] = entry;
            console.log(
              "Checking sessionId",
              sessionId,
              "against target",
              targetSessionId,
              sessionId === targetSessionId
            );
            if (sessionId === targetSessionId) {
              const activeTabIndex = tabsWithActiveRecording.indexOf(tabId);
              console.log("Active tab idx", activeTabIndex);
              tabsWithActiveRecording.splice(activeTabIndex, 1);
              tabSessionId.delete(tabId);
              notifyTabStatusChanged(tabId);
            }
          }
          sendResponse(true);
        } else {
          console.warn("No active tabs found when trying to stop recording");
          sendResponse(false);
        }
      });
      return true;
    } else if (message.type === MessageType.SAVE_PAGE_NOTE) {
      getStore().then((store) => {
        const { note, url } = message.payload;
        const pages = store.pages;
        const page = store.pages.find((p) => p.url === url);
        if (page) {
          page.notes = [note];
          browser.storage.local.set({ pages });
          sendResponse(true);
        }
        sendResponse(false);
      });
      return true;
    }
  }
);
