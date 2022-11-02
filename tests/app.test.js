const {Game, parseFrame} = require('../src/poko.js');

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
  expect(game.curBB).toBe(5);
  expect(game.curSB).toBe(2);
});

test('Test setting dealer seat (CO_DEALER_SEAT)', () => {
  let frameData = {
    "seat": 6,
    "pid": "CO_DEALER_SEAT"
  };

  parseFrame(game, "CO_DEALER_SEAT", frameData);
  expect(game.hand.btn).toBe(frameData.seat - 1);
});

test('Test adding a player at game start (CO_TABLE_INFO)', () => {
  let frameData = {
    "pid": "CO_TABLE_INFO",
    "time": 24,
    "currentSeat": 5,
    "dealerSeat": 6,
    "lockSeat": 0,
    "tableState": 32,
    "seatState": [ 16, 0, 16, 80, 80, 16, 0, 0, 0 ],
    "account": [ 290, 0, 1357, 599, 581, 150, 0, 0, 0 ],
    "pcard3": [ 32896, 32896 ],
    "pcard4": [ 32896, 32896 ],
    "pcard5": [ 32896, 32896 ],
    "pbet": [ 0, 0, 0, 27, 0, 0, 0, 0, 0 ],
    "curPot": [ 37, 0, 0, 0, 0, 0, 0, 0, 0 ],
    "curRake": [ 1, 0, 0, 0, 0, 0, 0, 0, 0 ],
    "potCount": 0,
    "totalpot": 37,
    "bcard": [ 12, 19, 1, 45 ]
  }
  parseFrame(game, "CO_TABLE_INFO", frameData);
  frameData.seatState.forEach( (element, index) => { 
    if ( element != 0 ){
      expect(game.players[index]).not.toBe(null);    
    }
    else{
      expect(game.players[index]).toBe(null);
    }
  })

});


test('Test blind turns (CO_BLIND_INFO)', () => {
  let frameData = {
    "pid": "CO_BLIND_INFO",
    "seat": 3,
    "account": 145,
    "baseStakes": 0,
    "btn": 4,
    "bet": 5,
    "dead": 0
  };
  game.recording = true;

  parseFrame(game, "CO_BLIND_INFO", frameData);
  expect(game.hand.timeline[0].action).toBe("BB");
  expect(game.hand.timeline[0].amount).toBe(5);
});


