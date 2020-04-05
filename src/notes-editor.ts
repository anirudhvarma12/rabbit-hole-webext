import { Link } from "./models";
import { HtmlRenderer, Parser } from "commonmark";

const EDITOR_SELECTOR = "#notes-editor";
const EDITOR_TEXTAREA_SELECTOR = "#notes-editor-textarea";
const VIEWER_SELECTOR = "#notes-viewer";
const MODAL_SELECTOR = "#notes-modal";
const VIEWER_SUBMIT_SELECTOR = "#note-form-submit";

export class NotesEditor {
  private link: Link;

  open(link: Link) {
    this.link = link;
    this.setOpenState();
    this._openModal();
  }

  private _openModal() {
    //@ts-ignore
    $(MODAL_SELECTOR).modal("show");
    $(MODAL_SELECTOR).on("hidden.bs.modal", () => {
      document.querySelector(VIEWER_SUBMIT_SELECTOR).removeEventListener("click", this.saveNotes);
    });
  }

  private saveNotes() {}

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
    document.querySelector(VIEWER_SELECTOR).innerHTML = markup;
    document.querySelector(EDITOR_SELECTOR).setAttribute("style", "display:none");
    document.querySelector(VIEWER_SELECTOR).setAttribute("style", "display:block");
  }

  private renderEditor() {
    const textarea = document.querySelector(EDITOR_TEXTAREA_SELECTOR) as HTMLTextAreaElement;
    textarea.value = this.link.notes;
    document.querySelector(VIEWER_SELECTOR).setAttribute("style", "display:none");
    document.querySelector(EDITOR_SELECTOR).setAttribute("style", "display:block");
  }
}
