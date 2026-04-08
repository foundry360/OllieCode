import { Msg, setLocale } from "blockly/core";
import * as En from "blockly/msg/en";

let localeApplied = false;

/** English strings for all built-in Blockly blocks (labels, tooltips, etc.). */
export function initBlocklyLocale(): void {
  if (localeApplied) return;
  setLocale(En as unknown as { [key: string]: string });
  /** Scratch-style wording — Blockly defaults say “prompt for …”. */
  (Msg as Record<string, string>)["TEXT_PROMPT_TYPE_TEXT"] =
    "ask and wait (text)";
  (Msg as Record<string, string>)["TEXT_PROMPT_TYPE_NUMBER"] =
    "ask and wait (number)";
  localeApplied = true;
}
