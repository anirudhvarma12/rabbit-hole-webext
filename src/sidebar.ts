import { Message, MessageType } from "./messages";
import { Session } from "./models";

const CONTAINER_ID = "#main";

// TODO make this code better?
function getSessions(): Promise<Session[]> {
  const message: Message = {
    type: MessageType.GET_SESSIONS,
  };
  return browser.runtime.sendMessage(message);
}

function getDeleteSessionButton(session: Session) {
  const button = document.createElement("button");
  button.className = "delete-btn";
  button.addEventListener("click", () => {
    const message: Message = {
      type: MessageType.DELETE_SESSION,
      payload: session.id,
    };
    return browser.runtime.sendMessage(message).then(() => {
      const listItem = document.querySelector(`#session-${session.id}`);
      document.querySelector(CONTAINER_ID).removeChild(listItem);
    });
  });
  button.innerText = "Delete";
  return button;
}

function getSessionList(sessions: Session[] = []): HTMLElement[] {
  return sessions.map((session) => {
    const element = document.createElement("div");
    element.id = `session-${session.id}`;
    const link = document.createElement("a");
    link.href = `viewer.html?sessionId=${session.id}`;
    link.target = "_blank";
    link.innerText = session.name;
    element.appendChild(link);
    element.appendChild(getDeleteSessionButton(session));
    return element;
  });
}

function setupButtons() {
  document
    .querySelector("#btnStartRecording")
    .addEventListener("click", async () => {
      await browser.runtime.sendMessage({
        type: MessageType.START_RECORDING,
      });
      refreshSessionList();
    });

  document
    .querySelector("#btnEndRecording")
    .addEventListener("click", async () => {
      await browser.runtime.sendMessage({
        type: MessageType.STOP_RECORDING,
      });
    });
}

function _onTabChanged(payload: { activeSession: boolean }) {
  if (payload.activeSession) {
    document.body.classList.add("is-active-recording");
  } else {
    document.body.classList.remove("is-active-recording");
  }
}

function setupBackgroundScriptListeners() {
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === MessageType.TAB_CHANGED) {
      _onTabChanged(message.payload);
    }
  });
}

function refreshSessionList() {
  const container = document.querySelector(CONTAINER_ID);
  // remove existing list items
  let childNode = container.firstChild;
  while (childNode !== null) {
    container.removeChild(childNode);
    childNode = container.firstChild;
  }
  // re-create list
  createSessionList();
}

async function createSessionList() {
  const sessions = await getSessions();
  const elements = getSessionList(sessions);
  const container = document.querySelector(CONTAINER_ID);
  elements.forEach((element) => {
    container.appendChild(element);
  });
}

async function main() {
  createSessionList();
  setupButtons();
  setupBackgroundScriptListeners();
}

main().then();
