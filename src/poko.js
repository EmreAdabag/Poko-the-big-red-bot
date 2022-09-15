import { inspect } from 'util';
import { emitter } from './eventEmitter.js';

const actions = { 
    2 : "SB",       // SMALL BLIND
    4 : "BB",       // BIG BLIND
    8 : "P",        // POST
    64 : "CH",      // CHECK
    128 : "R",      // RAISE
    256 : "C",      // CALL
    512 : "RR",     // RE-RAISE
    1024 : "F",     // FOLD
    2048 : "CS",    // CALL-SHOVE
    4096 : "S"      // SHOVE
};
// "W"      WIN

const phases = {
    2 : "X",        // PRE-PREFLOP
    8 : "P",        // PREFLOP
    16 : "F",       // FLOP
    32 : "T",       // TURN
    64 : "R"        // RIVER
}

// const positions = {
//     0 : "D",        // DEALER
//     1 : "S",        // SMALL BLIND
//     2 : "B"         // BIG BLIND
// }



const seats = { "seat1" : 0, 
                "seat2" : 1, 
                "seat3" : 2, 
                "seat4" : 3, 
                "seat5" : 4, 
                "seat6" : 5, 
                "seat7" : 6, 
                "seat8" : 7, 
                "seat9" : 8};



class Player {

    constructor ( stack = 0, id = null, cards = [0x8080, 0x8080] ){
        this.stack = stack;
        this.id = id;
        this.cards = cards;
        this.sittingOut = false;
        this.position = -1;

        /*---------------------------
        *   VPIP (voluntary put-in-pot) = pre.vpip / hands
        *           -incremented if player voluntarily contributes to pot anytime preflop
        *           -OR if everyone limps/folds, bb checks and bets/calls/check-calls/check-raises the flop
        * 
        *   PFR (pre-flop raise) = pre.raisins / hands
        *   
        * ---------------------------*/
        
        
        this.stats = {
            hands: 0,
            amtWon : 0,
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
    }

    resetHand(  ){
        console.log(this.timeline);
        this.bbVal = -1;
        this.sbVal = -1;
        this.btn = -1;
        this.bb = -1;
        this.sb = -1;
        this.pot = [];
        this.rake = 0;
        this.timeline = [];
        this.phase = "X";
    }

}

class Game {

    constructor (  ) {
        console.log("game created");
        this.players = [];
        for (let i = 0; i < 9; i++){
            this.players.push( null );
        }
        this.recording = false;
        this.hand = new Hand(  );
        this.mySeat = null;
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


function parseFrame(curGame, frameType, frameData) {
    if (curGame == undefined || curGame == null)
        return;

    switch (frameType){

        case undefined:
            break;

        default:
            break;

        // only sent when joining table
        // contains: blinds
        case "CO_OPTION_INFO":
            curGame.hand.bbVal = frameData.bblind;
            curGame.hand.sbVal = frameData.sblind;
            break;

        case "CO_TABLE_STATE":
            curGame.hand.phase = phases[ frameData.tableState ];
            if ( curGame.hand.phase == "X" )
                curGame.recording = true;    
            break;

        // contains: which seat is dealer
        // this one acts kinda weird tho
        case "CO_DEALER_SEAT":
            // dealer is 0-indexed
            curGame.hand.btn = frameData.seat - 1;
            
            // let i = curGame.hand.btn + 1;
            // while ( curGame.players[ i ] == null || curGame.players[ i ].sittingOut == true ){ i = ( i + 1 ) % 9; }
            // curGame.players[ i ].position = 1;
            // while ( curGame.players[ i ] == null || curGame.players[ i ].sittingOut == true ){ i = ( i + 1 ) % 9; }
            // curGame.players[ i ].position = 2;
            break;    

        case "PLAY_SEAT_RESERVATION":
            curGame.mySeat = frameData.seat;
            break;

        // blind turns
        case "CO_BLIND_INFO":
            // add timeline event
            curGame.writeTurn( 
                curGame.players[ frameData.seat - 1 ],
                actions[ frameData.btn ],
                frameData.bet + frameData.baseStakes     // check basestakes on tournament play
            );
            
            // update player stack
            curGame.players[ frameData.seat - 1 ].stack = frameData.account;

            if ( frameData.btn === 4 ){
                curGame.hand.bb = frameData.seat - 1;
            }
            else if ( frameData.btn === 2 ){
                curGame.hand.sb = frameData.seat - 1;
            }
            else if ( frameData.btn === 8 ){
                // posted in, VPIP? EMRE
            }
            break;

        // contains: current game state
        case "CO_TABLE_INFO":
            frameData.seatState.forEach((element, index) => {
                if ( element != 0 ){
                    curGame.players[ index ] = new Player( frameData.account[ index ] );
                    console.log(`new player joining from seat: ${index + 1}`);

                    if ( element & 32 )
                        curGame.players[index].sittingOut = true;

                }
            })
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
                    // EMRE consider ordering cards
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
                curPlayer, 
                curAction,
                frameData.raise != 0 ? frameData.raise : frameData.bet
                );

            if (curGame.hand.phase == undefined || curGame.hand.phase === "X")
                break;
        
            else if ( curGame.hand.phase === "P" ){
                switch (curAction) {
                    case "F":
                        playStat.pre.folds++;
                        emitter.emit('pF', [ frameData.seat - 1 ] );
                        break;
                    case "R":
                    case "RR":
                    case "S":
                        if ( curPlayer.stats.pfrRecorded === false ){
                            curPlayer.stats.pfrRecorded = true;
                            playStat.pre.raisins++;
                            emitter.emit('pR', [ frameData.seat - 1 ] );
                        }
                    case "CS":
                    case "C":
                        if ( curPlayer.stats.vpipRecorded === false ){
                            curPlayer.stats.vpipRecorded = true;
                            playStat.pre.vpip++;
                            emitter.emit('V', [ frameData.seat - 1 ] );    
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
                        emitter.emit('F', [ frameData.seat - 1 ] );
                        break;
                    case "C":
                    case "CS":
                        playStat.post.calls++;
                        emitter.emit('C', [ frameData.seat - 1 ] );

                        // catches a big blind that checks a limp preflop
                        if ( curPlayer.stats.vpipRecorded === false ){
                            curPlayer.stats.vpipRecorded = true;
                            playStat.pre.vpip++;
                            emitter.emit('V', [ frameData.seat - 1 ] );    
                        }
                        break;    
                    case "R":
                    case "S":
                        playStat.post.raisins++;
                        emitter.emit('R', [ frameData.seat - 1 ] );

                        // catches a big blind that checks a limp preflop
                        if ( curPlayer.stats.vpipRecorded === false ){
                            curPlayer.stats.vpipRecorded = true;
                            playStat.pre.vpip++;
                            emitter.emit('V', [ frameData.seat - 1 ] );    
                        }
                        break;    
                    
                    default:
                        break;
                }
            }

            console.log( `player: ${ frameData.seat } stats: ${ inspect(playStat, false, null, true /* enable colors */) }` );

            // update stack
            curGame.players[ frameData.seat - 1 ].stack = frameData.account;
            break;


        // turns taken with preselects
        case "CO_SELECT_SPEED_INFO":
            frameData["btn"].forEach(( element, index ) => { 
                if ( element != 0 ){
                    curGame.writeTurn(
                        curGame.players[ index ],
                        actions[ element ],
                        frameData["raise"][index] != 0 ? frameData["raise"][index] : frameData["bet"][index]
                    );

                    curGame.players[ index ].stack = frameData["account"][index];
                }
            });
            break;
            

        case "CO_CHIPTABLE_INFO":
            curGame.hand.pot = frameData["curPot"];
            curGame.hand.rake = frameData["curRake"];
            break;

        case "CO_CURRENT_PLAYER":
            if ( frameData["seat"] == curGame.mySeat ){
                // signify our hand
            }
            break;    
        
        case "CO_BCARD3_INFO":
            curGame.writeEvent( frameData["bcard"] );
            break;
        
        case "CO_BCARD1_INFO":
            curGame.writeEvent( frameData["card"] );
            break;

        case "CO_PCARD_INFO":
            curGame.players[ frameData["seat"] - 1 ].cards = frameData["card"];
            break;
        
        case "CO_POT_INFO":
            frameData.returnHi.forEach(( element, index ) => {
                if ( element != 0 ){
                    curGame.writeTurn(
                        curGame.players[ index ],
                        "W",
                        element
                    );
                    curGame.players[ index ].stats.amtWon += element;
                    emitter.emit('win', [ index, 'W'] );
                }
            })
            
            frameData.returnLo.forEach(( element, index ) => {
                if ( element != 0 ){
                    curGame.writeTurn(
                        curGame.players[ index ],
                        "W",
                        element
                    );
                    curGame.players[ index ].stats.amtWon += element;
                    emitter.emit('win', [ index ] );
                }
            })
            break;

        case "CO_RESULT_INFO":
            frameData.account.forEach(( element, index ) => {
                if (curGame.players[ index ] != null)
                    curGame.players[ index ].stack = element;
            })
            break;

        // EMRE modify this for tournament play
        case "PLAY_CLEAR_INFO":
            curGame.hand.resetHand(  );
            emitter.emit('END_HAND');
            break;

        case "PLAY_SEAT_INFO":
            if ( frameData.type == 1 ){
                if ( frameData.state == 16 ){
                    curGame.players[ frameData.seat - 1 ] = new Player( frameData.account );
                    emitter.emit( 'TABLE_UPDATE', frameData.seat - 1, true );
                    console.log(`new player joining from seat: ${frameData.seat}`);    
                }
                else if ( frameData.state == 32 ){
                    curGame.players[ frameData.seat - 1 ].sittingOut = true;
                    console.log(`player sitting out at seat: ${frameData.seat}`);
                }
            }
            else if ( frameData.type == 0){
                if ( frameData.state == 16 ){
                    curGame.players[ frameData.seat - 1 ] = null;
                    emitter.emit( 'TABLE_UPDATE', frameData.seat - 1, false );
                    console.log(`old player leaving from seat: ${frameData.seat}`);
                }
                else if ( frameData.state == 32 ){
                    curGame.players[ frameData.seat - 1 ].sittingOut = false;
                    console.log(`player coming back from seat: ${frameData.seat}`);    
                }
            }
            break;
    }
}


export { Game, parseFrame };