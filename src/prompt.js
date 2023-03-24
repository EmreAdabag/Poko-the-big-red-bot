

Here's an example prompt:

hand: 9H, 9S
stack: 500
position: 0

blinds: 2/5
active players: 6
pot: 47

preflop actions: 
3F, 4F, 5R15, 0C15, 1F, 2C10
flop actions:
1Ch, 2R30, 5F


{
    "hand": ["AH", "3S"],
    "stack": 500,
    "position": 5,
    "blinds": "2/5",
    "players": 6,
    "pot": 47,
    "board": ["QC", "8D", "3C"],
    "preflop": [
      {"player": 3, "action": "F"},
      {"player": 4, "action": "F"},
      {"player": 5, "action": "R", "amount": 15},
      {"player": 0, "action": "C", "amount": 15},
      {"player": 1, "action": "F"},
      {"player": 2, "action": "C", "amount": 15}
    ],
    "flop": [
      {"player": 2, "action": "Ch"},
    ],
    "turn": [
    ],
    "river":[
    ]
  }


note: your position doesn't account correctly for non-full tables


function createPrompt( game ){
    return `{
        "Hand": [],
        "Stack": ${game.players[game.mySeat].stack},
        "Position": ${game.mySeat},
        "Blinds": "\$${game.hand.bb}/\$${game.hand.sb}",
        "Players": ${game.players.filter((element) => element !== null && element.sittingout != true).length},
        "Pot": ${game.hand.pot[0]},
        "Board": ${game.hand.board.map((element) => parsecard(element))},
        "Timeline": ${JSON.stringify(game.hand.timeline).replace(/},/g, "}\n\t\t\t")}
    }`
}

{
    "Hand": [],
    "Stack": 145,
    "Position": 2,
    "Blinds": "$2/$1",
    "Players": 9,
    "Pot": 37,
    "Board": HA,SJ,CT,
    "Timeline": [{"player":1,"action":"SB","amount":2}
        {"player":2,"action":"BB","amount":5}
        {"player":3,"action":"F","amount":0}
        {"player":4,"action":"F","amount":0}
        {"player":5,"action":"F","amount":0}
        {"player":6,"action":"RR","amount":15}
        {"player":7,"action":"C","amount":15}
        {"player":8,"action":"F","amount":0}
        {"player":0,"action":"F","amount":0}
        {"player":1,"action":"F","amount":0}
        {"player":2,"action":"F","amount":0}
        {"player":"board","action":"flop","amount":[26,49,9]}]
}

You are a poker master playing at a table with amateur, but experienced players. You'll be given prompts in the following format that contain the state of the hand. You will respond with the best move given the information. Card ranks will be encoded as 2, 3, 4, 5, 6, 7, 8, 9, T, J, Q, K, A and suits will be encoded as S (spades), C (clubs), D (diamonds), H (hearts) so AS would be the ace of spades and 3H would be the three of hearts. Positions will be encoded relative to the button, with the button being position 0, small blind 1, big blind 2, etc. Moves will be encoded as an action followed by a number of chips: Ch (check), C (call), R (raise), S (shove), F (fold). F and Ch (fold and check) won't be followed by a chip amount. Actions will be separated by the street (preflop, flop, turn, river) and will be formatted as a list of players and their actions. For example 0R100 means player 0 raised 100 chips and 2F means player 2 folded. Your response should be a move (Ch, C, R, S, F) followed by a chip count if applicable.

function createPrompt( game ){
    return `{
        "Hand": [],
        "Stack": ${game.players[game.mySeat].stack},
        "Position": ${game.mySeat},
        "Blinds": "\$${game.hand.bb}/\$${game.hand.sb}",
        "Players": ${game.players.filter((element) => element !== null && element.sittingout != true).length},
        "Pot": ${game.hand.pot[0]},
        "Board": ${game.hand.board.map((element) => parsecard(element))},
        "Timeline": ${JSON.stringify(game.hand.timeline).replace(/},/g, "}\n\t\t\t").replace(/{"player":"dealer","action":"flop".*}/, "Flop")}
    }`
}

fix blinds, rm sb, bb, rm check/fold amt


You are a highly skilled poker player giving advice on what move to make in specific scenarios. You'll be prompted with a scenario that describes the state of a game and you'll respond with an advised move using the given format. The game information will be presented as follows:
 
Cards will be represented by two characters, one for the rank and one for the suit. Ranks will be 1,2,3,4,5,6,7,8,9,T,J,Q,K,A and suits will use "D" for diamonds, "H" for hearts, "C" for clubs, and "S" for spades so three of hearts will be shown as 3H   and the ace of spades will be AS. Players will be numbered starting at 0 for the player on the button and proceeding clockwise so the little blind will be player 1, big blind player 2, and so on. The possible actions for a player at each turn will be encoded as follows: "F" for fold, "CH" for check, "C" for call, "R" for raise, and "S" for shove all-in.

The response will be an advised move following 