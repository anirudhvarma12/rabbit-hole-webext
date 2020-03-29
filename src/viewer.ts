import { Message, MessageType } from "./messages";
import { Session, Store } from "./models";
declare let vis: any;
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
    browser.runtime.sendMessage(message).then((state: Pick<Store, "pages" | "links">) => {
      const nodes = new vis.DataSet(
        state.pages.map((p, index, items) => {
          return {
            id: p.url,
            label: p.title,
            shape: "box",
            color: {
              background: index == 0 ? "#58B19F" : "#1B9CFC"
            }
          };
        })
      );

      const edges = new vis.DataSet(
        state.links.map(link => {
          return {
            from: link.source_url,
            to: link.target_url
          };
        })
      );
      const container = document.getElementById("explorer");
      const data = {
        nodes,
        edges
      };
      const network = new vis.Network(container, data, {
        interaction: {
          navigationButtons: true
        }
      });
    });
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await setup();
});

document.querySelector("#submit_btn").addEventListener("click", handleSubmit);
