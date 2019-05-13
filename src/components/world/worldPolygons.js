/**
 * ---------------------------------------------------------------------------------------
 * worldPolygons.js
 * ---------------------------------------------------------------------------------------
 */

const T = THREE

const LEVEL_VERTICES = "[\n" +
    "    [\n" +
    "        [\n" +
    "            -8.91353702545166,\n" +
    "            -17.479455947875977\n" +
    "        ],\n" +
    "        [\n" +
    "            -8.91353702545166,\n" +
    "            -36.40216064453125\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            -8.91353702545166,\n" +
    "            -36.40216064453125\n" +
    "        ],\n" +
    "        [\n" +
    "            8.91353702545166,\n" +
    "            -36.40216064453125\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            8.91353702545166,\n" +
    "            -36.40216064453125\n" +
    "        ],\n" +
    "        [\n" +
    "            8.91353702545166,\n" +
    "            -17.39829444885254\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            8.91353702545166,\n" +
    "            -17.39829444885254\n" +
    "        ],\n" +
    "        [\n" +
    "            40.51353454589844,\n" +
    "            -17.39829444885254\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            40.51353454589844,\n" +
    "            -17.39829444885254\n" +
    "        ],\n" +
    "        [\n" +
    "            40.51353454589844,\n" +
    "            -12.45728874206543\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            40.51353454589844,\n" +
    "            -12.45728874206543\n" +
    "        ],\n" +
    "        [\n" +
    "            8.91353702545166,\n" +
    "            -12.45728874206543\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            8.91353702545166,\n" +
    "            -12.45728874206543\n" +
    "        ],\n" +
    "        [\n" +
    "            8.91353702545166,\n" +
    "            1.8892298936843872\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            8.91353702545166,\n" +
    "            1.8892298936843872\n" +
    "        ],\n" +
    "        [\n" +
    "            3.4950411319732666,\n" +
    "            1.8892298936843872\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            3.4950411319732666,\n" +
    "            1.8892298936843872\n" +
    "        ],\n" +
    "        [\n" +
    "            3.4950411319732666,\n" +
    "            28.989233016967773\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            3.4950411319732666,\n" +
    "            28.989233016967773\n" +
    "        ],\n" +
    "        [\n" +
    "            -3.372009038925171,\n" +
    "            28.989233016967773\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            -3.372009038925171,\n" +
    "            28.989233016967773\n" +
    "        ],\n" +
    "        [\n" +
    "            -3.372009038925171,\n" +
    "            1.8892298936843872\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            -3.372009038925171,\n" +
    "            1.8892298936843872\n" +
    "        ],\n" +
    "        [\n" +
    "            -8.91353702545166,\n" +
    "            1.8892298936843872\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            -8.91353702545166,\n" +
    "            1.8892298936843872\n" +
    "        ],\n" +
    "        [\n" +
    "            -8.91353702545166,\n" +
    "            -12.449369430541992\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            -8.91353702545166,\n" +
    "            -12.449369430541992\n" +
    "        ],\n" +
    "        [\n" +
    "            -40.71353530883789,\n" +
    "            -12.449369430541992\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            -40.71353530883789,\n" +
    "            -12.449369430541992\n" +
    "        ],\n" +
    "        [\n" +
    "            -40.71353530883789,\n" +
    "            -17.479455947875977\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            -40.71353530883789,\n" +
    "            -17.479455947875977\n" +
    "        ],\n" +
    "        [\n" +
    "            -8.91353702545166,\n" +
    "            -17.479455947875977\n" +
    "        ]\n" +
    "    ]\n" +
    "]"

const COMMAND_CONSOLE_VERTICES = "[\n" +
    "    [\n" +
    "        [\n" +
    "            -1.7541699409484863,\n" +
    "            -32.0\n" +
    "        ],\n" +
    "        [\n" +
    "            -1.7541699409484863,\n" +
    "            -34.0\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            -1.7541699409484863,\n" +
    "            -34.0\n" +
    "        ],\n" +
    "        [\n" +
    "            2.2550768852233887,\n" +
    "            -34.0\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            2.2550768852233887,\n" +
    "            -34.0\n" +
    "        ],\n" +
    "        [\n" +
    "            2.2550768852233887,\n" +
    "            -32.0\n" +
    "        ]\n" +
    "    ],\n" +
    "    [\n" +
    "        [\n" +
    "            2.2550768852233887,\n" +
    "            -32.0\n" +
    "        ],\n" +
    "        [\n" +
    "            -1.7541699409484863,\n" +
    "            -32.0\n" +
    "        ]\n" +
    "    ]\n" +
    "]"

// flip Y (Z) axis because of Blender different orientation
const levelPolyV3 = JSON.parse(LEVEL_VERTICES).map(e => new T.Vector3(e[0][0], 0, e[0][1] * -1))
const commandConsolePolyV3 = JSON.parse(COMMAND_CONSOLE_VERTICES).map(e => new T.Vector3(e[0][0], 0, e[0][1] * -1))

export {levelPolyV3 as LEVEL_POLY, commandConsolePolyV3 as COMMAND_CONSOLE_POLY}