# API reference

The development API is available at `http://localhost:8080`. Requests and responses use JSON unless an endpoint returns no content.

{% hint style="danger" %}
The API has no authentication and allows cross-origin development access. Do not expose it directly to an untrusted network.
{% endhint %}

## Module catalog

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/modules` | List registered solvers |
| `GET` | `/api/modules?category=MODDED_REGULAR` | Filter by category |
| `GET` | `/api/modules?search=morse` | Search catalog metadata |
| `GET` | `/api/modules/crazy-talk/displays` | List supported Crazy Talk displays |

A catalog item contains `id`, `name`, `category`, `type`, `tags`, `description`, `hasInput`, `hasOutput`, and `checkFirst`.

## Rounds

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/rounds` | Create a round in `SETUP` state |
| `GET` | `/rounds` | List round summaries |
| `GET` | `/rounds/{roundId}` | Load a round with bombs and modules |
| `POST` | `/rounds/{roundId}/start` | Start a configured round |
| `GET` | `/rounds/{roundId}/events` | Read persisted round events |
| `DELETE` | `/rounds/{roundId}` | Delete a round and its children |

Event queries accept an optional ISO-8601 `since` timestamp and a `limit` that defaults to `50`.

## Bombs

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/rounds/{roundId}/bombs` | Add a configured bomb |
| `PUT` | `/bombs/{bombId}/config` | Replace bomb edgework |
| `POST` | `/bombs/{bombId}/strike` | Add a strike |
| `DELETE` | `/bombs/{bombId}` | Delete a bomb |

Create a bomb:

```json
{
  "serialNumber": "AB1CD2",
  "aaBatteryCount": 2,
  "dBatteryCount": 1,
  "indicators": {
    "CAR": true,
    "FRK": false
  },
  "portPlates": [
    ["DVI", "PARALLEL"],
    ["SERIAL"]
  ],
  "modules": {
    "WIRES": 1,
    "BUTTON": 1
  }
}
```

Supported port values are `DVI`, `PARALLEL`, `PS2`, `RJ45`, `SERIAL`, and `STEREO_RCA`.

## Modules

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/bombs/{bombId}/modules` | Add one or more modules of a type |
| `GET` | `/bombs/{bombId}/modules/{moduleId}` | Load one module |
| `DELETE` | `/bombs/{bombId}/modules/{moduleId}` | Remove a module during setup |
| `POST` | `/bombs/{bombId}/modules/{moduleId}/reset` | Clear state, solution, and solved status |
| `POST` | `/bombs/{bombId}/modules/{moduleId}/complete` | Confirm physical completion |
| `PUT` | `/bombs/{bombId}/modules/{moduleId}/twitch-code` | Assign a Twitch selector |

Add modules:

```json
{
  "type": "MORSE_CODE",
  "count": 2
}
```

Completion and Twitch-code updates use the module's optimistic-lock `version`. A stale version returns `409 Conflict`.

## Solve a module

```http
POST /rounds/{roundId}/bombs/{bombId}/modules/{moduleId}/solve
```

Every solve request wraps module-specific fields in `input`:

```json
{
  "input": {
    "field1": "value",
    "field2": 3
  }
}
```

A final calculation returns an output and a solve-stage flag:

```json
{
  "output": {
    "solution": "example"
  },
  "solved": true
}
```

A rule or validation failure returns:

```json
{
  "reason": "Explain what must be corrected"
}
```

The exact input and output fields depend on the selected solver. Invalid input conversion returns `400`; an unregistered solver type returns `501`.

## WebSocket events

Connect through SockJS at `/ws`, then subscribe with STOMP to:

```text
/topic/rounds/{roundId}
```

Messages contain `type`, `timestamp`, `payload`, and sometimes an event `id`. Clients should refresh the round after relevant events rather than treating the message as a complete entity snapshot.

