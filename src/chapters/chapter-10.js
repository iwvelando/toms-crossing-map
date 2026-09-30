// Reviewed paraphrases. All board coordinates are illustrative.
export default {
  "eventAdditions": [],
  "chapters": [
    {
      "id": 10,
      "title": "The Awides Mine",
      "label": "Chapter Ten",
      "partial": false,
      "scope": "Reviewed movement coverage"
    }
  ],
  "characters": [],
  "locations": [
    {
      "id": "awides-mine-mouth",
      "name": "Awides Mine mouth",
      "x": 0.2,
      "z": -9.1,
      "chapter": 10,
      "notes": [
        {
          "chapter": 10,
          "text": "Wide exterior shelf, bent entrance tunnel and fire chamber; the rear shaft is a separate hazard. Awides, Awaitis and Awitus are provisional spellings."
        }
      ]
    },
    {
      "id": "bent-mine-tunnel",
      "name": "Bent mine tunnel",
      "x": -0.7,
      "z": -8.4,
      "chapter": 10,
      "notes": []
    },
    {
      "id": "mine-fire-chamber",
      "name": "Mine fire chamber",
      "x": -1.8,
      "z": -7.8,
      "chapter": 10,
      "notes": [
        {
          "chapter": 10,
          "text": "Iron rails and a cave-in to the left, fire to the right; a rear passage opposite the entrance has a roped-off deep shaft."
        }
      ]
    },
    {
      "id": "rear-passage",
      "name": "Rear passage",
      "x": -2.4,
      "z": -8.8,
      "chapter": 10,
      "notes": []
    },
    {
      "id": "deep-rear-shaft",
      "name": "Deep rear shaft",
      "x": -2.9,
      "z": -9.4,
      "chapter": 10,
      "notes": []
    },
    {
      "id": "samoa",
      "name": "Samoa",
      "schematic": false,
      "chapter": 10,
      "notes": []
    },
    {
      "id": "united-states-stops-unspecified",
      "name": "United States (stops unspecified)",
      "schematic": false,
      "chapter": 10,
      "notes": []
    }
  ],
  "events": [
    {
      "chapter": 10,
      "kind": "travel",
      "people": [
        "K",
        "landry-gatestone",
        "navidad",
        "mouse",
        "jojo"
      ],
      "actors": [
        "K",
        "landry-gatestone",
        "navidad",
        "mouse",
        "jojo"
      ],
      "route": [
        "westward-high-path",
        "awides-mine-mouth"
      ],
      "title": "Reaching the mine shelf",
      "time": "Thursday evening",
      "summary": "The westward high path eases onto a broad shelf at the dark mine mouth. Kalin dismounts, runs back a short distance calling for Tom, then returns to the horses.",
      "note": "They have backtracked beyond the official entrance while staying high. Damaged mountain-face wording cannot identify a precise face here.",
      "routes": {},
      "id": "reaching-the-mine-shelf",
      "mode": "Travel",
      "reference": "Chapter Ten · The Awides Mine",
      "places": []
    },
    {
      "chapter": 10,
      "kind": "travel",
      "people": [
        "K",
        "navidad",
        "mouse",
        "landry-gatestone",
        "jojo"
      ],
      "actors": [
        "K"
      ],
      "route": [
        "awides-mine-mouth",
        "bent-mine-tunnel",
        "awides-mine-mouth",
        "bent-mine-tunnel",
        "awides-mine-mouth"
      ],
      "title": "Bringing the horses inside",
      "time": "Thursday night",
      "summary": "Kalin blindfolds and leads Navidad through the tunnel, returns, then takes Mouse inside and returns again. Landry and Jojo wait on the exterior shelf.",
      "note": "The horse entries are sequential, not one shared trip; their individual paths can be selected.",
      "routes": {
        "navidad": [
          "awides-mine-mouth",
          "bent-mine-tunnel",
          "mine-fire-chamber"
        ],
        "mouse": [
          "awides-mine-mouth",
          "bent-mine-tunnel",
          "mine-fire-chamber"
        ],
        "landry-gatestone": [
          "awides-mine-mouth"
        ],
        "jojo": [
          "awides-mine-mouth"
        ]
      },
      "id": "bringing-the-horses-inside",
      "mode": "Travel",
      "reference": "Chapter Ten · The Awides Mine",
      "places": []
    },
    {
      "chapter": 10,
      "kind": "travel",
      "people": [
        "K",
        "landry-gatestone",
        "jojo",
        "navidad",
        "mouse"
      ],
      "actors": [
        "K",
        "landry-gatestone",
        "jojo"
      ],
      "route": [
        "awides-mine-mouth",
        "bent-mine-tunnel",
        "mine-fire-chamber"
      ],
      "title": "Around the tunnel bend",
      "time": "Thursday night",
      "summary": "Landry leads blindfolded Jojo while holding Kalin's hand. Around the bend they reach the fire chamber, where Navidad and Mouse are tied by iron rails near a left-side cave-in. Fire is to the right; Kalin ropes off the deep shaft opposite the entrance.",
      "note": "Landry's sense of a very long walk is not a measured tunnel length.",
      "routes": {
        "navidad": [
          "mine-fire-chamber"
        ],
        "mouse": [
          "mine-fire-chamber"
        ]
      },
      "places": [
        "deep-rear-shaft"
      ],
      "id": "around-the-tunnel-bend",
      "mode": "Travel",
      "reference": "Chapter Ten · The Awides Mine"
    },
    {
      "chapter": 10,
      "kind": "travel",
      "people": [
        "K",
        "landry-gatestone"
      ],
      "actors": [
        "K"
      ],
      "route": [
        "mine-fire-chamber",
        "rear-passage",
        "mine-fire-chamber"
      ],
      "title": "Small trips within the shelter",
      "time": "Thursday night",
      "summary": "Kalin fetches old wooden chairs from the dark rear passage for fuel. Landry later goes outside for ice and returns to the chamber.",
      "note": "Landry's distinct out-and-back route can be selected; neither trip advances along a mountain route.",
      "routes": {
        "landry-gatestone": [
          "mine-fire-chamber",
          "awides-mine-mouth",
          "mine-fire-chamber"
        ]
      },
      "id": "small-trips-within-the-shelter",
      "mode": "Travel",
      "reference": "Chapter Ten · The Awides Mine",
      "places": []
    },
    {
      "chapter": 10,
      "kind": "recollection",
      "people": [
        "landry-gatestone",
        "sondra-gatestone"
      ],
      "actors": [
        "landry-gatestone"
      ],
      "route": [
        "samoa",
        "united-states-stops-unspecified"
      ],
      "title": "Landry's earlier moves",
      "time": "Reported by Sondra",
      "summary": "Landry is born in Samoa, moves among unspecified places in the United States and is adopted by Sondra at about six.",
      "note": "Her biological father's hometown near Monticello does not establish a stop in Landry's itinerary.",
      "routes": {},
      "id": "landry-s-earlier-moves",
      "mode": "Recollection",
      "reference": "Chapter Ten · The Awides Mine",
      "places": []
    },
    {
      "chapter": 10,
      "kind": "recollection",
      "people": [
        "K"
      ],
      "actors": [
        "K"
      ],
      "route": [
        "awides-mine-mouth"
      ],
      "title": "Earlier knowledge of the mine",
      "time": "Reported by Kalin",
      "summary": "Kalin says he found the mine while exploring after hearing of a haunted cave later used as a mine.",
      "note": "No date or complete earlier approach is supplied.",
      "routes": {},
      "id": "earlier-knowledge-of-the-mine",
      "mode": "Recollection",
      "reference": "Chapter Ten · The Awides Mine",
      "places": []
    },
    {
      "chapter": 10,
      "kind": "travel",
      "people": [
        "K",
        "landry-gatestone",
        "tom-gatestone",
        "ash"
      ],
      "actors": [
        "K"
      ],
      "route": [
        "mine-fire-chamber",
        "awides-mine-mouth",
        "mine-fire-chamber"
      ],
      "title": "Looking for Tom",
      "time": "Thursday night",
      "summary": "Kalin makes repeated searches outside and returns. Tom and Ash reappear near the entrance; Kalin and Landry speak to Tom on the exterior slope. Landry goes back inside, followed by Kalin and eventually Tom and Ash.",
      "note": "No separate off-mountain trip is established during Tom's absence; his eventual chamber arrival remains spectral.",
      "routes": {
        "landry-gatestone": [
          "mine-fire-chamber",
          "awides-mine-mouth",
          "mine-fire-chamber"
        ],
        "tom-gatestone": [
          "awides-mine-mouth",
          "mine-fire-chamber"
        ],
        "ash": [
          "awides-mine-mouth",
          "mine-fire-chamber"
        ]
      },
      "id": "looking-for-tom",
      "mode": "Travel",
      "reference": "Chapter Ten · The Awides Mine",
      "places": []
    }
  ],
  "annotations": []
};
