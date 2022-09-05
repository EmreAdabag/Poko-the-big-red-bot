const puppeteer = require('puppeteer');
const credentials = require('./creds')

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

        
        this.stats = {
            hands: 0,
            bigBlindsWon : 0,
            pre: {
                folds: 0,
                vpip: 0,
                raisins: 0
            },
            post: {
                calls: 0,
                bets: 0,
                raisins: 0,
                checks: 0
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

    constructor ( bigBlind, smlBlind, btn, pot, rake ) {
        this.bBlind = bigBlind;
        this.sBlind = smlBlind;
        this.btn = btn;
        this.pot = pot;
        this.rake = rake;
        this.timeline = [];
    }

    resetHand(  ){
        console.log(this.timeline);

        this.btn = -1;
        this.pot = [];
        this.rake = 0;
        this.timeline = [];
        this.phase = "X";
    }

}

class Game {

    constructor ( hands, allPlayers, curBB, curSB ) {
        console.log("game created");
        this.players = [];
        for (let i = 0; i < 9; i++){
            this.players.push( null );
        }
        this.hands = hands;
        this.allPlayers = allPlayers;
        this.curBB = curBB;
        this.curSB = curSB;
        this.recording = false;
        this.hand = new Hand(  );
        this.mySeat = 0;
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
            curGame.curBB = frameData.bblind;
            curGame.curSB = frameData.sblind;
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
            curGame.hand.btn = frameData["seat"] - 1;
            
            // let i = curGame.hand.btn + 1;
            // while ( curGame.players[ i ] == null || curGame.players[ i ].sittingOut == true ){ i = ( i + 1 ) % 9; }
            // curGame.players[ i ].position = 1;
            // while ( curGame.players[ i ] == null || curGame.players[ i ].sittingOut == true ){ i = ( i + 1 ) % 9; }
            // curGame.players[ i ].position = 2;
            break;    

        // blind turns
        case "CO_BLIND_INFO":
            // add timeline event
            curGame.writeTurn( 
                curGame.players[ frameData["seat"] - 1 ],
                actions[ frameData["btn"] ],
                frameData["bet"] + frameData["baseStakes"]     // check basestakes on tournament play
            );
            
            // update player stack
            curGame.players[ frameData["seat"] - 1 ].stack = frameData["account"];
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
                    curGame.players[ seats[ playerSeat ] ].stats.hands++;

                    // EMRE consider ordering cards
                    curGame.players[ seats[ playerSeat ] ].cards = cards;
                }
            })
            break;


        // turns
        case "CO_SELECT_INFO":

            // current hand gets new turn appended
            curGame.writeTurn( 
                curGame.players[ frameData.seat - 1 ], 
                actions[ frameData.btn ],
                frameData.raise != 0 ? frameData.raise : frameData.bet
                );

            let curAction = actions[ frameData.btn ];
            let playStat = curGame.players[ frameData.seat - 1 ].stats;

            // console.log(`phase: ${curGame.hand.phase}`);
            if (curGame.hand.phase == undefined || curGame.hand.phase === "X")
                break;
        
            else if ( curGame.hand.phase === "P" ){
                switch (curAction) {
                    case "F":
                        playStat.pre.folds++;
                        break;
                    case "R":
                    case "RR":
                        playStat.pre.raisins++;
                    case "S":
                    case "CS":
                    case "C":
                        playStat.pre.vpip++;
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
                        break;    
                    case "R":
                    case "S":
                        playStat.post.raisins++;
                        break;    
                    
                    default:
                        break;
                }
            }

            console.log( `player: ${ frameData.seat } stats: ${ playStat }` );

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
            frameData[ "returnHi" ].forEach(( element, index ) => {
                if ( element != 0 ){
                    curGame.writeTurn(
                        curGame.players[ index ],
                        "W",
                        element
                    );
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
            break;

        case "PLAY_SEAT_INFO":
            if ( frameData.type == 1 ){
                if ( frameData.state == 16 ){
                    curGame.players[ frameData.seat - 1 ] = new Player( frameData.account );
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


async function main() 
{
    const browser = await puppeteer.launch({
        headless: false, 
        defaultViewport: null,
        devtools: false,
    });
    const page = await browser.newPage();       // does this add dumnb windows?

    const client = await page.target().createCDPSession();

    var curGame = null;

    
    // client.on('Network.webSocketCreated', ({requestId, url}) => {
    // console.log('Network.webSocketCreated', requestId, url)
    // })
        
    // client.on('Network.webSocketClosed', ({requestId, timestamp}) => {
    // console.log('Network.webSocketClosed', requestId, timestamp)
    // })
        
    // client.on('Network.webSocketFrameSent', ({requestId, timestamp, response}) => {
    // console.log('Network.webSocketFrameSent', requestId, timestamp, response.payloadData)
    // })
    
    client.on('Network.webSocketFrameReceived', ({requestId, timestamp, response}) => {

    try{
        if ( !response.payloadData.includes("|") )
            return;

        var frameData = JSON.parse( response.payloadData.split('|', 2)[1] ).data;
        if ( Array.isArray(frameData) )
            var frameType = frameData[0].pid;
        else
            var frameType = frameData.pid;



    if (frameType === "CONNECT_LOGIN_INFO")    
        curGame = new Game( );
    else
        parseFrame(curGame, frameType, frameData);
        

    // console.log('Network.webSocketFrameReceived', requestId, timestamp, response.payloadData)


    } catch( error ) {
        console.log(error);
    }
})

    await client.send('Network.enable');

    await page.goto('https://www.bovada.lv/poker?overlay=login', { waitUntil: 'networkidle0' });

    await page.type('input#email', credentials.email);
    await page.type('input#login-password', credentials.pass); 

    await page.click('button#login-submit');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    await page.goto('https://www.bovada.lv/poker/poker-lobby/home', { waitUntil: 'networkidle0' });
    
    //                       join table


}

main();