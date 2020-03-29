import { Session, Store } from "./models";
import { Message, MessageType } from "./messages";

const setup = () => {
  const message: Message = {
    type: MessageType.GET_SESSIONS
  };
  browser.runtime.sendMessage(message).then(sessions => {
    console.log("Session", sessions);
    _setupSessionSelect(sessions);
  });
};

const _setupSessionSelect = (sessions: Session[] = []) => {
  const dropdown = document.querySelector("#session_select");
  sessions.forEach(session => {
    const optionElement = document.createElement("option");
    optionElement.innerText = session.name ? session.name : `${session.id}`;
    optionElement.setAttribute("value", `${session.id}`);
    dropdown.append(optionElement);
  });
};

export const handleSubmit = () => {
  const selectedValue = (document.querySelector("#session_select") as HTMLSelectElement).value;
  console.log("Selected", selectedValue);
  if (selectedValue) {
    const message: Message = {
      type: MessageType.GET_LINKS_AND_PAGES,
      payload: selectedValue
    };
    browser.runtime.sendMessage(message).then(state => {
      console.log(state);
    });
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await setup();
});

document.querySelector("#submit_btn").addEventListener("click", handleSubmit);
