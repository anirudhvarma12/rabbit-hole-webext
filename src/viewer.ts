import "bootstrap/js/dist/carousel";
import { Properties } from "vis";
import { Data, Edge, Network, Node } from "vis-network";
import { Message, MessageType } from "./messages";
import { Session, Store } from "./models";
import { NotesEditor } from "./notes-editor";

const setup = () => {
  const message: Message = {
    type: MessageType.GET_SESSIONS,
  };
  browser.runtime.sendMessage(message).then((sessions) => {
    _setupSessionSelect(sessions);
  });
};

const _setupSessionSelect = (sessions: Session[] = []) => {
  const dropdown = document.querySelector("#session_select");
  if (sessions.length == 0) {
    document.querySelector("#main").classList.add("is-unused");
  } else {
    document.querySelector("#main").classList.remove("is-unused");
  }
  sessions.forEach((session) => {
    const optionElement = document.createElement("option");
    optionElement.innerText = session.name ? session.name : `${session.id}`;
    optionElement.setAttribute("value", `${session.id}`);
    dropdown.append(optionElement);
  });
};

export const handleSubmit = () => {
  document.querySelector("#main").classList.remove("is-unselected");
  const selectedValue = (
    document.querySelector("#session_select") as HTMLSelectElement
  ).value;
  draw(selectedValue);
};

const draw = (selectedSession: string) => {
  if (selectedSession) {
    const message: Message = {
      type: MessageType.GET_LINKS_AND_PAGES,
      payload: selectedSession,
    };
    browser.runtime
      .sendMessage(message)
      .then((state: Pick<Store, "pages" | "links">) => {
        const nodes: Node[] = state.pages.map((p, index, items) => {
          return {
            id: p.url,
            label: p.title,
            shape: "box",
            color: {
              background: index == 0 ? "#58B19F" : "#1B9CFC",
            },
          };
        });
        const edges: Edge[] = state.links.map((link) => {
          return {
            from: link.source_url,
            to: link.target_url,
            label: link.label,
            arrows: "to",
            length: 80,
            id: link.id ?? link.timestamp,
            physics: false,
          };
        });

        const container = document.getElementById("explorer");
        const data: Data = {
          nodes,
          edges,
        };
        const network = new Network(container, data, {
          interaction: {
            navigationButtons: true,
          },
        });
        network.on("click", (clickData: any) => {
          handleClick(clickData, edges, nodes);
        });
      });
  }
};

const handleClick = (clickData: Properties, edges: Edge[], nodes: Node[]) => {
  // If any nodes are clicked, redirect and open that article.
  if (clickData.nodes?.length > 0) {
    //We use URLs as ID.
    const firstUrl = clickData.nodes[0];
    window.open(firstUrl, "_blank");
    return;
  } else if (clickData.edges?.length > 0) {
    const message: Message = {
      type: MessageType.GET_LINK,
      payload: clickData.edges[0],
    };
    browser.runtime.sendMessage(message).then((link) => {
      if (!link) {
        alert("Link not found!");
      } else {
        const editor = new NotesEditor();
        editor.onSave = () => {
          const selectedValue = (
            document.querySelector("#session_select") as HTMLSelectElement
          ).value;
          draw(selectedValue);
        };
        editor.open(link);
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const params = window.location.search;
  if (params && params.length) {
    const queryParams = new URLSearchParams(params.replace("?", ""));
    if (queryParams.has("sessionId")) {
      const sessionId = queryParams.get("sessionId");
      console.log("trying to draw", sessionId);
      setTimeout(() => {
        (document.querySelector("#session_select") as HTMLSelectElement).value =
          sessionId;
        handleSubmit();
      }, 100);
    }
  }
  await setup();
});

document.querySelector("#submit_btn").addEventListener("click", handleSubmit);
