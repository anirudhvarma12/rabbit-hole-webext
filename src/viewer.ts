import { Message, MessageType } from "./messages";
import { Session, Store } from "./models";
import { DataSet, Properties, Edge, Node } from "vis";
import { NotesEditor } from "./notes-editor";

declare let vis: any;
const setup = () => {
  const message: Message = {
    type: MessageType.GET_SESSIONS,
  };
  browser.runtime.sendMessage(message).then((sessions) => {
    console.log("Session", sessions);
    _setupSessionSelect(sessions);
  });
};

const _setupSessionSelect = (sessions: Session[] = []) => {
  const dropdown = document.querySelector("#session_select");
  sessions.forEach((session) => {
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
      payload: selectedValue,
    };
    browser.runtime.sendMessage(message).then((state: Pick<Store, "pages" | "links">) => {
      const nodes = new vis.DataSet(
        state.pages.map((p, index, items) => {
          return {
            id: p.url,
            label: p.title,
            shape: "box",
            color: {
              background: index == 0 ? "#58B19F" : "#1B9CFC",
            },
          };
        })
      );

      const edges = new vis.DataSet(
        state.links.map((link) => {
          return {
            from: link.source_url,
            to: link.target_url,
            arrows: "to",
            length: 80,
            id: link.id ?? link.timestamp,
          };
        })
      );
      const container = document.getElementById("explorer");
      const data = {
        nodes,
        edges,
      };
      const network = new vis.Network(container, data, {
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

const handleClick = (clickData: Properties, edges: DataSet<Edge>, nodes: DataSet<Node>) => {
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
        editor.open(link);
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await setup();
});

document.querySelector("#submit_btn").addEventListener("click", handleSubmit);
