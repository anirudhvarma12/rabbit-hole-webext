import { Link } from "./models";
import { HtmlRenderer, Parser } from "commonmark";
import { Message, MessageType } from "./messages";

const EDITOR_SELECTOR = "#notes-editor";
const EDITOR_TEXTAREA_SELECTOR = "#notes-editor-textarea";
const VIEWER_SELECTOR = "#notes-viewer";
const MODAL_SELECTOR = "#notes-modal";
const VIEWER_SUBMIT_SELECTOR = "#note-form-submit";
const NOTES_VIEW_AREA_SELECTOR = "#notes-render-area";
const EDIT_MODE_BTN_SELCETOR = "#edit-mode-btn";

export class NotesEditor {
  private link: Link;

  open(link: Link) {
    this.link = link;
    this.setOpenState();
    this._openModal();
  }

  private _openModal() {
    document.querySelector(VIEWER_SUBMIT_SELECTOR).addEventListener("click", this.saveNotes.bind(this));
    document.querySelector(EDIT_MODE_BTN_SELCETOR).addEventListener("click", this.renderEditor.bind(this));
    //@ts-ignore
    $(MODAL_SELECTOR).modal("show");
    $(MODAL_SELECTOR).on("hidden.bs.modal", () => {
      document.querySelector(VIEWER_SUBMIT_SELECTOR).removeEventListener("click", this.saveNotes.bind(this));
      document.querySelector(EDIT_MODE_BTN_SELCETOR).removeEventListener("click", this.renderEditor.bind(this));
    });
  }

  private saveNotes() {
    const input = (document.querySelector(EDITOR_TEXTAREA_SELECTOR) as HTMLInputElement).value;
    const savePayload: Message = {
      type: MessageType.SAVE_LINK_NOTE,
      payload: {
        id: this.link.id ?? this.link.timestamp,
        value: input,
      },
    };
    var _class = this;
    browser.runtime.sendMessage(savePayload).then(() => {
      _class.link.notes = input;
      _class.renderViewer();
    });
  }

  private setOpenState() {
    if (this.link.notes?.length > 0) {
      this.renderViewer();
    } else {
      this.renderEditor();
    }
  }

  private renderViewer() {
    const parser = new Parser({});
    const node = parser.parse(this.link.notes);
    const writer = new HtmlRenderer({ safe: true });
    const markup = writer.render(node);
    document.querySelector(NOTES_VIEW_AREA_SELECTOR).innerHTML = markup;
    document.querySelector(EDITOR_SELECTOR).setAttribute("style", "display:none");
    document.querySelector(VIEWER_SELECTOR).setAttribute("style", "display:block");
  }

  private renderEditor() {
    const textarea = document.querySelector(EDITOR_TEXTAREA_SELECTOR) as HTMLTextAreaElement;
    textarea.value = this.link.notes ?? "";
    document.querySelector(VIEWER_SELECTOR).setAttribute("style", "display:none");
    document.querySelector(EDITOR_SELECTOR).setAttribute("style", "display:block");
  }
}
