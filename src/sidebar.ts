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

function getSessionList(sessions: Session[] = []): HTMLElement[] {
  return sessions.map((session) => {
    const element = document.createElement("div");
    const link = document.createElement("a");
    link.href = `viewer.html?sessionId=${session.id}`;
    link.target = "_blank";
    link.innerText = session.name;
    element.appendChild(link);
    return element;
  });
}

async function main() {
  const sessions = await getSessions();
  const elements = getSessionList(sessions);
  const container = document.querySelector(CONTAINER_ID);
  elements.forEach((element) => {
    container.appendChild(element);
  });
}

main().then();
