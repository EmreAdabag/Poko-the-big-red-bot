let {Game, parseFrame} = require('../src/poko.js');

let game = new Game();

test('Test setting blinds (CO_OPTION_INFO)', () => {
  let frameData = {
    "pid": "CO_OPTION_INFO",
    "bblind": 5,
    "sblind": 2,
    "gameType": 2,
    "gameType2": 1,
    "hiLow": 0,
    "maxSeat": 9,
    "maxStakes": 0,
    "minStakes": 0,
    "real": 1
  };

  parseFrame(game, "CO_OPTION_INFO", frameData);
  expect(game.curBB).toBe(50);
  expect(game.curSB).toBe(25);
});

