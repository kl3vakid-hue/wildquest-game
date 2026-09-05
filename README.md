# WildQuest Game

Build a complete, modern mobile-first web app called WildQuest.

The app is a multiplayer wildlife-spotting game designed for people visiting South African game reserves and national parks.

CORE IDEA

Players create or join a group before entering the park.

When a player sees an animal, they select the animal in the app and record the sighting. The animal gives a certain number of points depending on how difficult or rare it is to see.

Players compete individually, while their group can also compete against other groups.

The app should feel like a fun mixture of:

- Wildlife spotting
- A game
- A group competition
- A leaderboard
- A digital wildlife checklist

TECH STACK

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- Firebase for authentication and realtime multiplayer data
- Lucide React icons

Make the application responsive and mobile-first because users will primarily use it on their phones.

Use a clean, modern African/wildlife visual style.

MAIN SCREENS

1. HOME SCREEN

Show:

"WILDQUEST"

Subtitle:
"Turn your game drive into a competition."

Buttons:

- Create Game
- Join Game
- My Profile

Include a wildlife-themed background/hero section.

---

2. CREATE GAME

Allow the user to enter:

- Player name
- Group name
- Game name

Generate a unique 6-character game code.

Example:

GAME CODE
"K7P4XM"

Display:

"Give this code to the other players."

Button:
"Start Game"

---

3. JOIN GAME

Allow players to enter:

- Their name
- Game code

After joining, show the current players in the group.

Example:

GAME: Kruger Adventure

PLAYERS:
 Daniel
 James
 Sarah
 Liam

Show a "Ready" button.

The host can start the game.

---

4. GAME DASHBOARD

This is the main screen.

Show:

Game name
Group name
Player's current score

Example:

KRUGER ADVENTURE

Your Score
 420

Buttons:

[ SPOT ANIMAL ]

[ LEADERBOARD ]

[ MY COLLECTION ]

[ GROUP ]

Also show:

Animals spotted: 12 / 40

---

5. SPOT ANIMAL

Create a grid of animals.

Each animal should have:

- Image
- Name
- Points
- Rarity

Example animals:

Lion – 100 points – Legendary
Leopard – 150 points – Legendary
Cheetah – 120 points – Very Rare
Wild Dog – 130 points – Very Rare
Elephant – 50 points – Uncommon
Rhino – 60 points – Uncommon
Buffalo – 40 points – Common
Giraffe – 30 points – Common
Zebra – 20 points – Common
Warthog – 15 points – Common
Hippo – 40 points – Uncommon
Kudu – 25 points – Common
Impala – 10 points – Common
Hyena – 70 points – Rare
Crocodile – 60 points – Uncommon

When the player taps an animal:

Show a confirmation popup:

"Did you spot a Lion?"

Buttons:

YES, I SAW IT
CANCEL

After confirming:

Add the points to the player's score.

Add the animal to their collection.

Create a sighting record with:

- Player
- Animal
- Time
- Game
- Points

Show a fun animation:

"+100 "

---

6. PREVENT EASY CHEATING

A player should not be able to repeatedly claim the same animal.

By default, each player can claim each animal once per game.

However, allow special animals to have a "multiple sightings" option later.

Show claimed animals as:

✓ SPOTTED

and disable the button.

---

7. LEADERBOARD

Create a live leaderboard.

Example:

 LEADERBOARD

1. Daniel — 520
2. Sarah — 470
3. James — 420
4. Liam — 310

Update the leaderboard in realtime using Firebase.

Also include:

GROUP LEADERBOARD

Group A — 1,240 points
Group B — 980 points
Group C — 760 points

---

8. MY COLLECTION

Create a wildlife collection screen.

Display all animals in a grid.

Animals that have been spotted should appear in full colour.

Animals that have not been spotted should appear as dark/grey silhouettes.

Example:

✓ Lion
✓ Elephant
✓ Zebra
?
Leopard
?
Cheetah

At the top:

"12 / 40 Animals Found"

"420 Total Points"

---

9. GROUP SCREEN

Show:

Group name

Members

Individual scores

Total group score

Animals found by the group.

Allow the host to:

- Remove players
- End the game

---

10. END GAME

When the host ends the game, show a celebration screen.

Example:

 GAME COMPLETE!

WINNER

 Daniel

520 POINTS

Animals spotted:
18 / 40

Also show:

Most Valuable Spotter
Rarest Animal
Most Animals Found

Include a "Play Again" button.

---

ANIMAL DATABASE

Create a reusable animal database containing at least 30 South African wildlife species.

Each animal should have:

{
  id: string;
  name: string;
  points: number;
  rarity: "Common" | "Uncommon" | "Rare" | "Very Rare" | "Legendary";
  image: string;
}

Include:

Lion
Leopard
Cheetah
African Wild Dog
Elephant
Black Rhino
White Rhino
Buffalo
Giraffe
Zebra
Warthog
Hippo
Crocodile
Hyena
Kudu
Impala
Wildebeest
Eland
Waterbuck
Nyala
Sable
Roan Antelope
Ostrich
Baboon
Vervet Monkey
Bushbuck
Duiker
Klipspringer
Porcupine
Honey Badger

Balance the points according to rarity.

---

DATABASE STRUCTURE

Use Firebase Firestore.

Create collections:

users
games
players
groups
animals
sightings

A game should contain:

- gameCode
- gameName
- hostId
- groupId
- status
- createdAt

A player should contain:

- userId
- name
- gameId
- groupId
- score
- animalsSpotted

A sighting should contain:

- playerId
- gameId
- animalId
- points
- timestamp

---

REALTIME MULTIPLAYER

Use Firebase realtime listeners so that:

- Player scores update immediately
- New players appear immediately
- Leaderboards update immediately
- Animal sightings appear immediately
- Group scores update immediately

Do not require users to refresh the page.

---

UI DESIGN

Use a premium wildlife aesthetic.

Use:

- Dark green
- Earth tones
- Sand colours
- Gold accents
- Rounded cards
- Large animal images
- Smooth animations

The interface should look like a professional mobile game rather than a basic school project.

Use large buttons that are easy to press while outdoors.

Make the main dashboard extremely simple.

---

MOBILE NAVIGATION

Create a bottom navigation bar:

 Home
 Spot
 Rankings
 Collection
 Group

The navigation should remain visible on mobile.

---

ANIMATIONS

Add subtle animations using Framer Motion.

Examples:

When gaining points:

"+100 XP"

should animate onto the screen.

When discovering a rare animal:

Show:

 RARE DISCOVERY!

When discovering a legendary animal:

Show a larger celebration animation.

---

OFFLINE SUPPORT

Because users may have poor/no signal inside a game reserve, design the app so that animal data and the basic interface can work offline.

Queue sightings locally if the user temporarily loses connection.

Synchronise them with Firebase when the connection returns.

---

IMPORTANT

Do NOT build everything as one giant component.

Use a clean folder structure:

src/
components/
pages/
data/
hooks/
services/
types/
utils/

Create reusable components.

Use TypeScript properly.

Do not use placeholder buttons that do nothing.

All major buttons should actually work.

Create a polished MVP that can be run with:

npm install
npm run dev

At the end, explain:

1. What files were created
2. How to install dependencies
3. How to configure Firebase
4. How to start the app
5. How multiplayer works
6. How to add more animals

If something cannot be implemented without Firebase credentials, create the complete Firebase integration and clearly mark the exact environment variables that I need to add.

Make the application functional first, then improve the visual design.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/06444091-0924-45b1-a91d-5c7b2d173000).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
