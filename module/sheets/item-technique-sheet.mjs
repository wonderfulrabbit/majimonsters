import { majiItemSheet } from "./item-sheet.mjs";

export class majiTechniqueSheet extends majiItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["majimonsters", "sheet", "item"],
      width: 600,
      height: 600
    });
  }
}
