import { emitter } from './eventEmitter.js';
import { actions, phases, seats } from './constants.js'

class Player {

    constructor ( stack = 0, id = null ){
        this.stack = stack;
        this.id = id;
        this.sittingOut = false;
        this.position = -1;
        this.bigHands = [];

        /*---------------------------
        *   VPIP (voluntary put-in-pot) = pre.vpip / hands
        *           -incremented if player voluntarily contributes to pot anytime preflop
        *           -OR if everyone limps/folds, bb checks and bets/calls/check-calls/check-raises the flop
        * 
        *   PFR (pre-flop raise) = pre.raisins / hands
        * 
        *   AF = bets + raises / calls
        *           -postflop, not by street
        * 
        *   BBWPOHH = amtwon * 100 / big blind * hands
        *   
        * ---------------------------*/
        
        
        this.stats = {
            hands: 0,
            savedHands: 0,
            boughtIn: stack,
            vpipRecorded : false,
            pfrRecorded : false,
            pre: {
                folds: 0,
                vpip: 0,
                raisins: 0
            },
            post: {
                calls: 0,
                bets: 0,
                raisins: 0,
                checks: 0,
                folds: 0
            } 
        };
    }

}

class Turn {

    constructor ( player, action, amount ) {
        this.player = player;
        this.action = action;
        this.amount = amount;
    }

}

class Hand {

    constructor (  ) {
        // this.bBlind = bigBlind;
        // this.sBlind = smlBlind;
        // this.btn = btn;
        // this.pot = pot;
        // this.rake = rake;
        this.timeline = [];
        this.board = [];
    }

    resetHand(  ){
        // console.log(this.timeline);
        // might want to update bbVal, sbVal
        this.btn = -1;
        this.pot = [];
        this.rake = 0;
        this.timeline = [];
        this.phase = "X";
        this.flopchop = null;
        this.turnchop = null;
        this.board = []
    }

    setPhase( phase ){
        this.phase  =  phase;
    }

}

export class Game {

    constructor (  ) {
        console.log("game created");
        this.players = [];
        for (let i = 0; i < 9; i++){
            this.players.push( null );
        }
        this.recording = false;
        this.tournament = false;
        this.hand = new Hand(  );
        this.mySeat = null;
        this.playerBank = {};
    }

    setPhase( phase ){
        this.hand.setPhase( phase );
    }

    writeEvent( input ){
        if ( !this.recording )
            return;

        this.hand.timeline.push( input );
    }

    writeTurn( player, action, amount ){
        this.writeEvent( new Turn( player, action, amount  ));
    }

}


export function parseFrame(curGame, frameType, frameData) {
    if (curGame == undefined || frameData == undefined )
        return;

    switch (frameType){
        
        default:
            break;

        case undefined:
            for ( const entry of frameData ){
                
                // for tournaments
                switch (entry.pid){
                    
                    case "CO_OPTION_INFO":
                        curGame.tournament = true;
                        curGame.hand.bbval = entry.bblind;
                        curGame.hand.sbval = entry.sblind;
                        break;
                    
                    case "CO_TABLE_INFO":
                        curGame.mySeat = entry.mySeat[0];

                        entry.seatState.forEach((element, index) => {
                            if ( element != 0 ){
                                curGame.players[ index ] = new Player( entry.account[ index ], entry.regSeatNo[ index ] );
                                console.log(`new player joining from seat: ${index + 1}`);
            
                                if ( element & 32 )
                                    curGame.players[ index ].sittingOut = true;
            
                            }
                        })
            
                        emitter.emit( 'TABLE_UPDATE' );
                        break;

                    default:
                        break;

                }
            }

            break;

        case "CO_OPTION_INFO":
            curGame.hand.bbval = frameData.bblind;
            curGame.hand.sbval = frameData.sblind;
            break;

        case "CO_TABLE_STATE":
            curGame.setPhase( phases[ frameData.tableState ] );
            
            if ( curGame.hand.phase === "X")
                curGame.recording = true;

            break;

        case "CO_DEALER_SEAT":
            curGame.hand.btn = frameData.seat - 1;
            break;    

        case "PLAY_SEAT_RESERVATION":
            if ( curGame.mySeat == null ){
                curGame.mySeat = frameData.seat - 1;   
            }
            break;

        // blind turns
        case "CO_BLIND_INFO":
            // add timeline event
            // curGame.writeTurn( 
            //     frameData.seat - 1,
            //     actions[ frameData.btn ],
            //     frameData.bet + frameData.baseStakes     // check basestakes on tournament play
            // );
            
            // update player stack
            curGame.players[ frameData.seat - 1 ].stack = frameData.account;

            if ( frameData.btn === 4 ){
                curGame.hand.bb = frameData.seat - 1;
            }
            else if ( frameData.btn === 2 ){
                curGame.hand.sb = frameData.seat - 1;
            }
            break;

        case "CO_TABLE_INFO":
            frameData.seatState.forEach((element, index) => {
                if ( element != 0 ){
                    curGame.players[ index ] = new Player( frameData.account[ index ] );
                    console.log(`new player joining from seat: ${index + 1}`);

                    if ( element & 32 )
                        curGame.players[index].sittingOut = true;

                }
            })

            emitter.emit( 'TABLE_UPDATE' );
            break;
        

        
        // contains: your cards, opponent cards, your seat, playing seats
        case "CO_CARDTABLE_INFO":    
            Object.entries( frameData ).forEach( entry => {
                const [ playerSeat, cards ] = entry;
                if ( seats[ playerSeat ] != undefined ){
                    let player = curGame.players[ seats[ playerSeat ] ];
                    player.stats.hands++;
                    player.stats.vpipRecorded = false;
                    player.stats.pfrRecorded = false;
                    player.cards = cards;
                }
            })
            break;


        // turns
        case "CO_SELECT_INFO":
            
            let curPlayer = curGame.players[ frameData.seat - 1 ];
            let curAction = actions[ frameData.btn ];
            let playStat = curGame.players[ frameData.seat - 1 ].stats;

            // current hand gets new turn appended
            curGame.writeTurn( 
                frameData.seat - 1, 
                curAction,
                frameData.raise != 0 ? frameData.raise : frameData.bet
                );

            if (curGame.hand.phase == undefined || curGame.hand.phase === "X")
                break;
        
            else if ( curGame.hand.phase === "P" ){
                switch (curAction) {
                    case "F":
                        playStat.pre.folds++;
                        break;
                    case "R":
                    case "RR":
                    case "S":
                        if ( curGame.recording && curPlayer.stats.pfrRecorded === false ){
                            curPlayer.stats.pfrRecorded = true;
                            playStat.pre.raisins++;
                        }
                    case "CS":
                    case "C":
                        if ( curGame.recording && curPlayer.stats.vpipRecorded === false ){
                            curPlayer.stats.vpipRecorded = true;
                            playStat.pre.vpip++;
                        }
                        break;
                    default:
                        break;
                }
            }
            else // postflop
            {
                switch (curAction) {
                    case "F":
                        playStat.post.folds++;
                        break;
                    case "C":
                    case "CS":
                        playStat.post.calls++;

                        // catches a big blind that checks a limp preflop
                        if ( curGame.recording && curPlayer.stats.vpipRecorded === false ){
                            curPlayer.stats.vpipRecorded = true;
                            playStat.pre.vpip++;
                        }
                        break;    
                    case "R":
                    case "S":
                        // no reraise
                        playStat.post.raisins++;

                        // catches a big blind that checks a limp preflop
                        if ( curGame.recording && curPlayer.stats.vpipRecorded === false ){
                            curPlayer.stats.vpipRecorded = true;
                            playStat.pre.vpip++;
                        }
                        break;    
                    
                    default:
                        break;
                }
            }

            // console.log( `player: ${ frameData.seat } stats: ${ inspect(playStat, false, null, true /* enable colors */) }` );

            // update stack
            curGame.players[ frameData.seat - 1 ].stack = frameData.account;
            break;


        // turns taken with preselects
        case "CO_SELECT_SPEED_INFO":
            frameData["btn"].forEach(( element, index ) => { 
                if ( element != 0 ){
                    curGame.writeTurn(
                        index,
                        actions[ element ],
                        frameData["raise"][index] != 0 ? frameData["raise"][index] : frameData["bet"][index]
                    );

                    curGame.players[ index ].stack = frameData["account"][index];
                }
            });
            break;
            

        case "CO_CHIPTABLE_INFO":
            curGame.hand.pot = frameData.curPot;
            curGame.hand.rake = frameData.curRake;
            break;

        case "CO_CURRENT_PLAYER":
            if ( frameData["seat"] == curGame.mySeat + 1 ){
                // signify our hand
                console.log(createPrompt( curGame ))
            }
            break;    
        
        case "CO_BCARD3_INFO":
            emitter.emit( 'ACTION_UPDATE', 0, curGame.hand.timeline.length, 'preflop' );
            curGame.writeTurn( 'dealer', 'flop', frameData.bcard );
            curGame.hand.board = curGame.hand.board.concat(frameData.bcard)
            curGame.hand.flopchop = curGame.hand.timeline.length;
            break;
        
        case "CO_BCARD1_INFO":
            curGame.writeTurn( 'dealer', 'card', frameData.card );
            if ( curGame.hand.turnchop == null ){
                curGame.hand.turnchop = curGame.hand.timeline.length;
                curGame.hand.board = curGame.hand.board.concat(frameData.card)
                emitter.emit( 'ACTION_UPDATE', curGame.hand.flopchop, curGame.hand.timeline.length, 'flop' );
            }
            else{
                curGame.hand.board = curGame.hand.board.concat(frameData.card)
                emitter.emit( 'ACTION_UPDATE', curGame.hand.turnchop, curGame.hand.timeline.length, 'turn' );
            }
            break;

        case "CO_PCARD_INFO":
            saveHand( curGame.players[ frameData.seat - 1 ], frameData.seat - 1, frameData.card, curGame.hand.timeline );
            break;
        
        case "CO_POT_INFO":
            frameData.returnHi.forEach(( element, index ) => {
                if ( element != 0 ){
                    curGame.writeTurn(
                        index,
                        "W",
                        element
                    );
                }
            })
            
            frameData.returnLo.forEach(( element, index ) => {
                if ( element != 0 ){
                    curGame.writeTurn(
                        index,
                        "W",
                        element
                    );
                }
            })
            break;

        case "CO_RESULT_INFO":
            // console.log('result info recieved')                     // PRINT
            // console.log(`here are players ${curGame.players}`)      // PRINT
            // console.log(`here are accs ${frameData.account}`)       // PRINT

            frameData.account.forEach( ( element, index ) => {
                try{
                    if (curGame.players[ index ] != null){
                        if(!curGame.recording){
                            curGame.players[ index ].stats.boughtIn = element;
                        }
                        curGame.players[ index ].stack = element;
                        console.log('player ' + index + ' stack ' + element + ' buyin ' + curGame.players[index].stats.boughtIn);
                    }
                }
                catch( e ){
                    console.log(`issue saving result ${e}`)
                }
            })
            break;

        // EMRE modify this for tournament play ? maybe not?
        case "PLAY_CLEAR_INFO":
            // console.log("clearing hand");
            curGame.hand.resetHand(  );
            emitter.emit( 'TABLE_UPDATE' );

            break;

        case "PLAY_ACCOUNT_CASH_RES":
            curGame.players[ frameData.seat - 1 ].stats.boughtIn = frameData.cash;
            break;

        case "PLAY_SEAT_INFO":
            if ( frameData.type == 1 ){
                if ( frameData.state == 16 ){

                    if ( curGame.tournament && frameData.regSeatNo && curGame.playerBank[ frameData.regSeatNo ] ){
                        curGame.players[ frameData.seat - 1 ] = curGame.playerBank[ frameData.regSeatNo ];
                    }
                    else if( curGame.tournament ){
                        curGame.players[ frameData.seat - 1 ] = new Player( frameData.account, frameData.regSeatNo );
                    }
                    else{
                        curGame.players[ frameData.seat - 1 ] = new Player( frameData.account );
                    }
                        
                    // emitter.emit( 'TABLE_UPDATE' );
                    console.log(`new player joining from seat: ${frameData.seat}`);    
                }
                else if ( frameData.state == 32 ){
                    curGame.players[ frameData.seat - 1 ].sittingOut = true;
                    console.log(`player sitting out at seat: ${frameData.seat}`);
                }
            }
            else if ( frameData.type == 0){
                if ( frameData.state == 16 ){
                    let curPlayer = curGame.players[ frameData.seat - 1 ];
                    
                    if ( curGame.tournament )
                        curGame.playerBank[ curPlayer.id ] = curPlayer;

                    curGame.players[ frameData.seat - 1 ] = null;

                    // emitter.emit( 'TABLE_UPDATE' );
                    console.log(`old player leaving from seat: ${frameData.seat}`);
                }
                else if ( frameData.state == 32 ){
                    curGame.players[ frameData.seat - 1 ].sittingOut = false;
                    
                    if (curGame.players[ frameData.seat - 1 ].stack != frameData.account){
                        curGame.players[ frameData.seat - 1 ].stats.boughtIn +=  frameData.account  - curGame.players[ frameData.seat - 1 ].stack
                    }
                    
                    console.log(`player coming back from seat: ${frameData.seat}`);    
                }
            }
            break;
    }
}


function saveHand( player, pno, pcards, timeline ){
    console.log('saving hand for player: ' + pno)               // PRINT
    console.log(`player: ${player}                              
    cards: ${pcards}
    tl: ${timeline}`)
    
    try
    { 
        let newhand = {'pno': pno, 'pcards': pcards, 'timeline': timeline }
        player.bigHands.push( newhand );
        player.stats.savedHands++;
    }
    catch ( e ){
        console.log(`issue saving hand:  ${e}`)
    }

}


const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
const suits = ["C", "D", "H", "S"];

function parsecard(card){
    return ranks[card%13] + suits[Math.floor(card/13)]
}


function createPrompt( game ){
    return `{
        "Hand": ${game.players[game.mySeat].cards.map((element) => parsecard(element))},
        "Stack": ${game.players[game.mySeat].stack},
        "Position": ${game.mySeat},
        "Blinds": "\$${game.hand.bb}/\$${game.hand.sb}",
        "Players": ${game.players.filter((element) => element !== null && element.sittingout != true).length},
        "Pot": ${game.hand.pot[0]},
        "Board": ${game.hand.board.map((element) => parsecard(element))},
        "Timeline": ${JSON.stringify(game.hand.timeline).replace(/},/g, "}\n\t\t\t").replace(/{"player":"dealer","action":"flop".*}/, "Flop")}
    }`
}


blinds broke, replace turn and riber