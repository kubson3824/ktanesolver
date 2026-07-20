# Glossary

Common KTaNE and KTANESolver terms used throughout this documentation.

## Bomb and round terms

### Bomb

One physical bomb casing in Keep Talking and Nobody Explodes. A KTANESolver round can contain multiple bombs.

### Edgework

Information around the sides of a bomb that module rules may reference: serial number, batteries, indicators, and port plates.

### Round

A KTANESolver session containing one or more bombs, their modules, strikes, and progress.

### Strike

A penalty recorded by the game after an incorrect action. Some solver rules change according to the current strike count.

## Edgework terms

### Battery holder

The physical holder containing batteries. A two-AA holder counts as one holder even though it contains two batteries.

### Indicator

A three-letter label on the bomb, such as `CAR` or `FRK`. Its light can be lit or unlit.

### Port plate

One physical plate containing zero or more ports. Plate grouping matters; identical ports split across separate plates are not equivalent to ports on one plate.

### Serial number

The six-character identifier printed on the bomb. Solver rules commonly inspect its letters, vowels, digits, or final digit.

## Module terms

### Module

One puzzle or interactive panel on a bomb.

### Regular module

A module that remains available until solved. Regular modules appear in the main module grid.

### Needy module

A recurring, timer-driven module that activates during the round. KTANESolver keeps needy modules in a separate panel.

### Vanilla module

A module included with the base game.

### Modded module

A community-created module installed through the KTaNE mod ecosystem.

### Multi-stage module

A module solved through several interactions. KTANESolver stores intermediate state so the next stage can resume after navigation or refresh.

### Check first

Catalog metadata for modules that require early attention, such as recording an initial display or entering information after every solve.

## KTANESolver terms

### Catalog

The backend-generated list of registered solvers and their names, categories, tags, contracts, and reminders. The frontend loads it from `/api/modules`.

### Module type

The stable enum identifier shared by persistence, the backend solver, the frontend UI, and Twitch command generation—for example `COMPLICATED_WIRES`.

### Solver state

Intermediate data stored in `ModuleEntity.state` for a module that is not finished calculating.

### Solution

Calculated output stored in `ModuleEntity.solution`. A solution does not mean the physical game module has been confirmed solved.

### Physical completion

The separate confirmation that the defuser performed the calculated action and the game accepted it.

### Twitch selector

A short identifier assigned to a module instance so KTaNE Twitch Plays can route a command to the correct module.

### Conditional Twitch command

A command that becomes safe only after the UI supplies additional physical context, such as a coordinate, timer digit, or current stage.

