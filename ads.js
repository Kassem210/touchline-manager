/* Touchline — pitch-side advertising boards shown in the live match tracker.
   t = text, bg = board colour, fg = text colour, cls = extra style class,
   img = optional logo picture (e.g. "logos/metro.png"); when set it replaces the text. */
"use strict";
const AD_KOSHK = { t: "KOSHK 3AM KADRY", ar: "كشك عم قدري", bg: "#f2c230", fg: "#1a1a1a", cls: "ad-koshk" };
const AD_METRO = { t: "metro", ar: "مترو", bg: "#d71920", fg: "#ffffff", cls: "ad-metro", img: "" };
const PITCH_ADS = [AD_METRO, AD_KOSHK, AD_METRO, AD_KOSHK, AD_METRO, AD_KOSHK];
