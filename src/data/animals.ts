import type { Animal, Rarity } from "@/types";

/**
 * WildQuest animal database.
 * To add an animal: append an entry below. Points are balanced by rarity band:
 * Common 10-30, Uncommon 40-60, Rare 70-90, Very Rare 110-140, Legendary 150+.
 */
export const ANIMALS: Animal[] = [
  { id: "leopard", name: "Leopard", points: 150, rarity: "Legendary", image: "🐆" },
  { id: "pangolin", name: "Pangolin", points: 200, rarity: "Legendary", image: "🦔" },
  { id: "lion", name: "Lion", points: 100, rarity: "Legendary", image: "🦁" },
  { id: "wild-dog", name: "African Wild Dog", points: 130, rarity: "Very Rare", image: "🐕" },
  { id: "cheetah", name: "Cheetah", points: 120, rarity: "Very Rare", image: "🐈" },
  { id: "aardvark", name: "Aardvark", points: 140, rarity: "Very Rare", image: "🐽" },
  { id: "caracal", name: "Caracal", points: 115, rarity: "Very Rare", image: "🐱" },
  { id: "black-rhino", name: "Black Rhino", points: 90, rarity: "Rare", image: "🦏" },
  { id: "serval", name: "Serval", points: 85, rarity: "Rare", image: "🐾" },
  { id: "hyena", name: "Hyena", points: 70, rarity: "Rare", image: "🐺" },
  { id: "honey-badger", name: "Honey Badger", points: 80, rarity: "Rare", image: "🦡" },
  { id: "sable", name: "Sable Antelope", points: 75, rarity: "Rare", image: "🐐" },
  { id: "roan", name: "Roan Antelope", points: 75, rarity: "Rare", image: "🦌" },
  { id: "porcupine", name: "Porcupine", points: 70, rarity: "Rare", image: "🦔" },
  { id: "white-rhino", name: "White Rhino", points: 60, rarity: "Uncommon", image: "🦏" },
  { id: "crocodile", name: "Crocodile", points: 60, rarity: "Uncommon", image: "🐊" },
  { id: "elephant", name: "Elephant", points: 50, rarity: "Uncommon", image: "🐘" },
  { id: "hippo", name: "Hippo", points: 40, rarity: "Uncommon", image: "🦛" },
  { id: "eland", name: "Eland", points: 50, rarity: "Uncommon", image: "🐂" },
  { id: "jackal", name: "Black-backed Jackal", points: 45, rarity: "Uncommon", image: "🦊" },
  { id: "klipspringer", name: "Klipspringer", points: 45, rarity: "Uncommon", image: "🐏" },
  { id: "ostrich", name: "Ostrich", points: 40, rarity: "Uncommon", image: "🦩" },
  { id: "buffalo", name: "Buffalo", points: 40, rarity: "Common", image: "🐃" },
  { id: "nyala", name: "Nyala", points: 35, rarity: "Common", image: "🦌" },
  { id: "waterbuck", name: "Waterbuck", points: 30, rarity: "Common", image: "🦌" },
  { id: "giraffe", name: "Giraffe", points: 30, rarity: "Common", image: "🦒" },
  { id: "bushbuck", name: "Bushbuck", points: 30, rarity: "Common", image: "🦌" },
  { id: "duiker", name: "Duiker", points: 28, rarity: "Common", image: "🦌" },
  { id: "kudu", name: "Kudu", points: 25, rarity: "Common", image: "🦌" },
  { id: "wildebeest", name: "Wildebeest", points: 25, rarity: "Common", image: "🐂" },
  { id: "baboon", name: "Baboon", points: 20, rarity: "Common", image: "🐒" },
  { id: "zebra", name: "Zebra", points: 20, rarity: "Common", image: "🦓" },
  { id: "vervet", name: "Vervet Monkey", points: 18, rarity: "Common", image: "🐵" },
  { id: "warthog", name: "Warthog", points: 15, rarity: "Common", image: "🐗" },
  { id: "impala", name: "Impala", points: 10, rarity: "Common", image: "🦌", repeatable: false },
  { id: "fishing-owl", name: "Pel's Fishing Owl", points: 140, rarity: "Very Rare", image: "🦉" },
  { id: "black-mamba", name: "Black Mamba", points: 130, rarity: "Very Rare", image: "🐍" },
  { id: "rock-python", name: "African Rock Python", points: 95, rarity: "Rare", image: "🐍" },
  { id: "chameleon", name: "Flap-necked Chameleon", points: 85, rarity: "Rare", image: "🦎" },
  { id: "ground-hornbill", name: "Southern Ground Hornbill", points: 80, rarity: "Rare", image: "🐦" },
  { id: "saddle-billed-stork", name: "Saddle-billed Stork", points: 75, rarity: "Rare", image: "🦩" },
  { id: "puff-adder", name: "Puff Adder", points: 70, rarity: "Rare", image: "🐍" },
  { id: "kori-bustard", name: "Kori Bustard", points: 60, rarity: "Uncommon", image: "🐦" },
  { id: "nile-monitor", name: "Nile Monitor", points: 55, rarity: "Uncommon", image: "🦎" },
  { id: "fish-eagle", name: "African Fish Eagle", points: 50, rarity: "Uncommon", image: "🦅" },
  { id: "marabou", name: "Marabou Stork", points: 45, rarity: "Uncommon", image: "🐦" },
  { id: "leopard-tortoise", name: "Leopard Tortoise", points: 30, rarity: "Common", image: "🐢" },
  { id: "lilac-breasted-roller", name: "Lilac-breasted Roller", points: 25, rarity: "Common", image: "🐦" },
  { id: "guineafowl", name: "Helmeted Guineafowl", points: 15, rarity: "Common", image: "🐔" },
];

export const TOTAL_ANIMALS = ANIMALS.length;

export const ANIMALS_BY_ID: Record<string, Animal> = Object.fromEntries(
  ANIMALS.map((animal) => [animal.id, animal]),
);

export const RARITY_ORDER: Rarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Legendary",
];

export const RARITY_TOKEN: Record<Rarity, string> = {
  Common: "text-common",
  Uncommon: "text-uncommon",
  Rare: "text-rare",
  "Very Rare": "text-veryrare",
  Legendary: "text-legendary",
};

export const RARITY_RING: Record<Rarity, string> = {
  Common: "border-common/40",
  Uncommon: "border-uncommon/50",
  Rare: "border-rare/60",
  "Very Rare": "border-veryrare/60",
  Legendary: "border-legendary/70",
};

export function getAnimal(id: string): Animal | undefined {
  return ANIMALS_BY_ID[id];
}
