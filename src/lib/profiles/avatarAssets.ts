/**
 * Profile avatars — PNGs in `public/images/avatars/`.
 * `id` is the filename without extension.
 */

const B = "/images/avatars";

function labelFromId(id: string): string {
  return id.replace(/([a-z])([A-Z])/g, "$1 $2");
}

const RAW = [
  { id: "Army", src: `${B}/Army.png` },
  { id: "Baseball", src: `${B}/Baseball.png` },
  { id: "Basketball", src: `${B}/Basketball.png` },
  { id: "Bowling", src: `${B}/Bowling.png` },
  { id: "Cat", src: `${B}/Cat.png` },
  { id: "Cowboy", src: `${B}/Cowboy.png` },
  { id: "Dog", src: `${B}/Dog.png` },
  { id: "Dumptruck", src: `${B}/Dumptruck.png` },
  { id: "Football", src: `${B}/Football.png` },
  { id: "Fox", src: `${B}/Fox.png` },
  { id: "Frog", src: `${B}/Frog.png` },
  { id: "Goat", src: `${B}/Goat.png` },
  { id: "Helicopter", src: `${B}/Helicopter.png` },
  { id: "Horse", src: `${B}/Horse.png` },
  { id: "Monkey", src: `${B}/Monkey.png` },
  { id: "Motorcycle", src: `${B}/Motorcycle.png` },
  { id: "Racecar", src: `${B}/Racecar.png` },
  { id: "RobotAI", src: `${B}/RobotAI.png` },
  { id: "Rollerskate", src: `${B}/Rollerskate.png` },
  { id: "Soccer", src: `${B}/Soccer.png` },
  { id: "Space", src: `${B}/Space.png` },
  { id: "Tractor", src: `${B}/Tractor.png` },
  { id: "Truck", src: `${B}/Truck.png` },
  { id: "Turtle", src: `${B}/Turtle.png` },
] as const;

export type OllieAvatarId = (typeof RAW)[number]["id"];

export const OLLIE_AVATARS: { id: OllieAvatarId; src: string; label: string }[] = RAW.map(
  (a) => ({ ...a, label: labelFromId(a.id) }),
);

const SLUG_SET = new Set<string>(OLLIE_AVATARS.map((a) => a.id));

export function isOllieAvatarSlug(s: string | null | undefined): s is OllieAvatarId {
  return s != null && s !== "" && SLUG_SET.has(s);
}

export function getAvatarBySlug(slug: string | null | undefined) {
  if (!isOllieAvatarSlug(slug)) return null;
  return OLLIE_AVATARS.find((a) => a.id === slug) ?? null;
}
