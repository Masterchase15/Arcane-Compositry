# Initiative Tracker

Your campaign (as DM) > **Initiative Tracker**. Only the campaign's DMs can see it. Everything is
saved as you work, so a refresh - or opening the site on another device -
picks up where you left off.

## Encounters

Each tracker is an **encounter**. The buttons along the top switch between
them, so a split party can have two fights running at once. **New encounter**
starts another; type in **Encounter name** to rename it. The number beside a
name is how many combatants are still standing.

**End encounter** deletes that tracker (it asks first). The NPCs and
characters themselves are not touched.

## Adding combatants

| Button                  | Where it comes from                                         |
| ----------------------- | ----------------------------------------------------------- |
| **Add enemy / NPC**     | Your NPCs & Enemies list. Asks how many, and can roll their initiative as it adds them. Copies of the same creature are numbered ("Bramble Wolf 2"). |
| **Add player character**| Every character at the table. Copies their current HP, Temp HP, AC (including items in use), Guard and Mana from their sheet. |
| **Add custom**          | A blank combatant for anything not on a list. Rename it in Details. |

What is carried over for an NPC: Hit Points and AC (the first number in each
box on its stat block), its initiative bonus (the Initiative box, or its
Dexterity modifier if that is blank), Guard (2 + Proficiency Bonus unless you
set one) and Mana.

## Initiative

- **Roll initiative for all** rolls d20 + bonus for everyone, sorts the list
  and restarts the rounds.
- **Roll** on a card rolls for just that combatant.
- Or **type a number** in a card's Initiative box when someone rolls real
  dice. The list re-sorts when you leave the box.
- Highest goes first. Ties go to the higher bonus. Use **Up** / **Down** to
  break a tie your own way, or when someone delays.

## Running the fight

The combatant at the top is **up now**.

- **Turn done** moves them to the bottom and the next one comes up. When the
  combatant who started the round comes back to the top, the **Round** counter
  goes up.
- **Guard refreshes** to its maximum for whoever comes up (the codex rule:
  Guard refreshes at the beginning of that creature's turn).
- **Hit** / **Heal**: type an amount and press one. Damage comes off Temporary
  Hit Points first; healing stops at Max HP. A combatant at half HP or less is
  marked **Bloodied**.
- Every number on a card can also be typed over directly.
- **Conditions** is a free-text box (Prone, Dazed, Broken Guard...).
- **Dead** moves a combatant to the **Fallen** list at the bottom, out of the
  turn order. **Revive** brings them back at the end of the order.
- **Remove** takes a combatant out of the encounter entirely.
- **Clear initiative & restart rounds** keeps everyone but wipes the initiative
  numbers, ready for the next fight.

## Details

**Details** opens a pop-up with two parts:

1. **In this encounter** - every tracked number, plus Conditions and a Notes
   box for this fight. Edit freely.
2. The full **stat block** (enemies and NPCs) or a **character summary**
   (players): abilities and saves, skills, Guard, Chain Length, Momentum Die,
   Mana, Arcane attack and Save DC, weapons, spells and Compositions.

For a player character there is also **Refresh from sheet**, which pulls their
current numbers in again, and a link to open their full sheet.

## Good to know

- The tracker keeps **its own copy** of the numbers. Changing a player's HP
  here does not change their sheet, and a player changing their sheet does not
  change the tracker until you press **Refresh from sheet**.
- An enemy's stat block is copied when it is added, so Details still works if
  you later edit or delete that NPC. Add it again to pick up the edit.
