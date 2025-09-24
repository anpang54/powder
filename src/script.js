

/*
    x = column = horizontal
    y = row = vertical
*/


// #region SETUP


// functions

function id(name) {
    return document.getElementById(name);
}


// mouse down/shift down detector

let mouseDown = false;
document.addEventListener("mousedown", () => { mouseDown = true; });
document.addEventListener("mouseup", () => { mouseDown = false; });

let shiftDown = false;
document.addEventListener("keydown", (event) => {
    if(event.key === "Shift") {
        shiftDown = true;
    }
});
document.addEventListener("keyup", (event) => {
    if(event.key === "Shift") {
        shiftDown = false;
    }
});


// #endregion


// #region CAMERA/TILES


// tiles

const tiles = {

    "void": [0, 0],
    "empty": [0, 1],

    "gravel": [1, 0],
    "grass": [2, 0],
    "sand": [3, 0],
    "stone": [4, 0],
    "water": [5, 0],
    "dirt": [6, 0]

}


// camera

function moveCamera(x, y) {
    cameraX = x;
    cameraY = y;
    updateAllTiles();
    id("camera-x").innerText = x;
    id("camera-y").innerText = y;
}

document.addEventListener("keydown", (event) => {
    if(event.key.startsWith("Arrow")) {
        const speed = event.shiftKey? 5:1;
        switch(event.key.substring(5)) {
            case "Up": moveCamera(cameraX, cameraY - speed); break;
            case "Down": moveCamera(cameraX, cameraY + speed); break;
            case "Left": moveCamera(cameraX - speed, cameraY); break;
            case "Right": moveCamera(cameraX + speed, cameraY); break;
        }
    }
});


// update tile

function updateTile(givenX, givenY) {
    const x = givenX + cameraX;
    const y = givenY + cameraY;
    let tileX, tileY;
    if(x in map && y in map[x]) {
        tileX = tiles[map[x][y]][0];
        tileY = tiles[map[x][y]][1];
    } else {
        tileX = 0;
        tileY = 0;
    }
    id(`tile-${givenX}-${givenY}`).style.backgroundPositionX = `calc(-${tileX} * 1em)`;
    id(`tile-${givenX}-${givenY}`).style.backgroundPositionY = `calc(-${tileY} * 1em)`;
}
function updateAllTiles() {
    for(let x = 1; x <= columns; ++x) {
        for(let y = 1; y <= rows; ++y) {
            updateTile(x, y);
        }
    }
}


// #endregion


// #region STARTUP


let cameraX = 0, cameraY = 0;


// get sizes

const em = parseFloat(getComputedStyle(document.body).fontSize);
const columns = Math.ceil(window.innerWidth / em);
const rows = Math.ceil(window.innerHeight / em);


// generate initial map

const mapSize = 320;
let map = [];

// empty cells
for(let x = 0; x < mapSize; ++x) {
    map.push([]);
    for(let y = 0; y < mapSize; ++y) {
        map[x].push("empty");
    }
}

// ground
for(let x = 11; x < columns - 10; ++x) {
    map[x + 100][rows + 100 - 10] = "grass";
    map[x + 100][rows + 100 - 9] = "stone";
    map[x + 100][rows + 100 - 8] = "stone";
}


// put tiles

let initialTiles = "";
for(let x = 1; x <= columns; ++x) {
    for(let y = 1; y <= rows; ++y) {
        initialTiles += `
            <div style="grid-column: ${x}; grid-row: ${y}" id="tile-${x}-${y}"></div>
        `;
    }
}
id("canvas").innerHTML = initialTiles;

for(let x = 1; x <= columns; ++x) {
    for(let y = 1; y <= rows; ++y) {
        id(`tile-${x}-${y}`).addEventListener("mouseover", function(x, y) {
            tileHover(x, y);
            if(mouseDown) {
                tileClick(x, y);
            }
        }.bind(null, x, y));
    }
}

moveCamera(100, 100);


// put selector tiles

let selectorTiles = "";
for(const [ID, location] of Object.entries(tiles)) {
    selectorTiles += `
        <button
            style="background-position-x: calc(-${location[0]} * 2em); background-position-y: calc(-${location[1]} * 2em)"
            id="selector-${ID}" title="${ID}"
        ></div>
    `;
}
id("menu-select").innerHTML = selectorTiles;

for(const [ID, location] of Object.entries(tiles)) {
    id(`selector-${ID}`).addEventListener("click", function(ID) {
        selectTile(ID);
    }.bind(null, ID));
}



// #endregion


// #region TILE ACTIONS


// drawing tiles

let brush = "empty";

function selectTile(ID) {
    id(`selector-${brush}`).classList.remove("selected");
    id(`selector-${ID}`).classList.add("selected");
    brush = ID;
}
selectTile("sand");

function tileClick(givenX, givenY) {

    const x = givenX + cameraX;
    const y = givenY + cameraY;

    map[x][y] = brush;
    if(shiftDown) {
        // make it a + shape
        map[x - 1][y] = brush;
        map[x + 1][y] = brush;
        map[x][y - 1] = brush;
        map[x][y + 1] = brush;
    }

    updateTile(x, y);

}


// hover on tile

function tileHover(x, y) {
    id("cursor-x").innerText = x + cameraX;
    id("cursor-y").innerText = y + cameraY;
}


// tile tick

let newMap;

function tick(givenX, givenY) {

    const x = givenX + cameraX;
    const y = givenY + cameraY;

    // check if tile actually exists
    if(!(x in map && y in map[x])) {
        return;
    }

    const tile = map[x][y];

    switch(map[x][y]) {

        // just fall down
        case "grass": case "dirt":
            if(newMap[x][y + 1] == "empty") {
                newMap[x][y] = "empty";
                newMap[x][y + 1] = tile;
            }
            break;

        // fall down diagonally too
        case "sand":
            if(newMap[x][y + 1] == "empty") {
                newMap[x][y] = "empty";
                newMap[x][y + 1] = "sand";
            } else {

                // try chosen direction first, then the other direction
                let direction = Math.random() < 0.5? -1: 1;
                if(newMap[x + direction][y + 1] == "empty") {
                    newMap[x][y] = "empty";
                    newMap[x + direction][y + 1] = "sand";
                } else if(newMap[x - direction][y + 1] == "empty") {
                    newMap[x][y] = "empty";
                    newMap[x - direction][y + 1] = "sand";
                }

            }
            break;

        // go left/right too
        case "water":
            if(newMap[x][y + 1] == "empty") {
                newMap[x][y] = "empty";
                newMap[x][y + 1] = "water";
            } else {

                // try chosen direction first, then the other direction
                let direction = Math.random() < 0.5? -1: 1;
                if(newMap[x + direction][y + 1] == "empty") {
                    newMap[x][y] = "empty";
                    newMap[x + direction][y + 1] = "water";
                } else if(newMap[x - direction][y + 1] == "empty") {
                    newMap[x][y] = "empty";
                    newMap[x - direction][y + 1] = "water";
                } else {

                    // same here
                    direction = Math.random() < 0.5? -1: 1;
                    if(newMap[x + direction][y] == "empty") {
                        newMap[x][y] = "empty";
                        newMap[x + direction][y] = "water";
                    } else if(newMap[x - direction][y] == "empty") {
                        newMap[x][y] = "empty";
                        newMap[x - direction][y] = "water";
                    }

                }

            }
            break;

    }
}

function tickAllTiles() {
    newMap = structuredClone(map); // deep copy
    for(let y = 1; y <= rows; ++y) {
        for(let x = 1; x <= columns; ++x) {
            tick(x, y);
        }
    }
    map = newMap;
    updateAllTiles();
}

setInterval(tickAllTiles, 50);


// #endregion