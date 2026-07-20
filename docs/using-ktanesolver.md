# Use KTANESolver

A round contains one or more bombs. Each bomb stores its edgework and module list; every solver reads that shared context.

## Create a round

1. Open the home page.
2. Select **Start New Round**.
3. Add the first bomb.

Round setup remains editable until the round starts.

## Configure a bomb

Enter the edgework exactly as it appears on the physical bomb:

- serial number;
- AA and D battery counts;
- lit and unlit indicators;
- each port plate and the ports on that plate;
- module names and quantities.

{% hint style="warning" %}
Port plates are significant. Two ports on one plate are not equivalent to the same ports on two separate plates.
{% endhint %}

You can add multiple bombs to the same round and edit their edgework before starting.

## Import a mission

The setup screen can import missions from the community KTaNE bomb catalog. Deterministic module pools are mapped into supported solver types. Random pools and unknown module IDs are reported so you can add them manually.

Always review the imported bomb before starting the round.

## Start solving

Select **Start Round** when every bomb and module is present.

The live defusal screen groups regular modules by bomb and places needy modules in a separate panel. Modules marked **Check These First** appear above the grid.

For each module:

1. Select the bomb, then the module.
2. Read the embedded manual and enter the visible state.
3. Select **Solve** to calculate the next action or final answer.
4. Perform the action on the physical bomb.
5. Confirm the module as solved only after the game accepts it.

Multi-stage solvers retain their progress. If a final answer exists but the physical module is still active, KTANESolver keeps the calculation separate from the completion confirmation.

## Record strikes

Use the strike control on the active bomb as soon as the game records a strike. Solvers that depend on strike count will then use the current value.

## Twitch Plays

Assign a short Twitch selector to a module when needed. Generated commands include that selector and can be copied one step at a time. See [Twitch Plays commands](twitch-plays-command-audit.md) for the safe-command rules.

## Live synchronization

Open clients subscribe to the round's WebSocket topic. Module updates, solves, strikes, and setup changes trigger a refresh after the database transaction commits.

If a client looks stale, use **Refresh** on the live defusal screen before repeating an action.

## Round history

The **Round History** page lists saved rounds and supports filtering by status and bomb details. Opening a round returns to setup or live defusal according to its state.

Deleting a round also removes its bombs, modules, and event history and cannot be undone.

