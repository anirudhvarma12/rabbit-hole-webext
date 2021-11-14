import { Page } from "../models";
import { Message, MessageType } from "../messages";

async function onNoteChange(note: string, url: string) {
  const message: Message = {
    type: MessageType.SAVE_PAGE_NOTE,
    payload: { note, url },
  };
  browser.runtime.sendMessage(message);
}

export class SessionDetailView {
  static render(pages: Page[], container: Element) {
    SessionDetailView.emptyContainer(container);
    pages.forEach((page) => {
      container.appendChild(SessionDetailView.createPageCard(page));
    });
  }

  private static emptyContainer(container: Element) {
    // remove existing list items
    let childNode = container.firstChild;
    while (childNode !== null) {
      container.removeChild(childNode);
      childNode = container.firstChild;
    }
  }

  private static createPageCard(page: Page) {
    const base = document.createElement("div");
    base.className = "card mb-2";
    const cardBody = document.createElement("div");
    cardBody.className = "card-body";
    const title = document.createElement("h5");
    const link = document.createElement("a");
    link.href = page.url;
    link.innerText = page.title;
    link.target = "_blank";
    title.className = "card-title";
    title.appendChild(link);
    cardBody.appendChild(title);
    const notes = document.createElement("textarea");
    notes.className = "form-control";
    // write now we only support one note.
    notes.value = page.notes ? page.notes[0] : "";
    notes.addEventListener("change", (event) =>
      onNoteChange((event.target as HTMLTextAreaElement).value, page.url)
    );
    notes.placeholder = "Insert notes here";

    cardBody.appendChild(notes);

    base.appendChild(cardBody);

    return base;
  }
}
