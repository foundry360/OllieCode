import { setLocale } from "blockly/core";
import * as En from "blockly/msg/en";

let localeApplied = false;

/** English strings for all built-in Blockly blocks (labels, tooltips, etc.). */
export function initBlocklyLocale(): void {
  if (localeApplied) return;
  setLocale(En as unknown as { [key: string]: string });
  localeApplied = true;
}
