"use strict"

// const { moduleExpression } = require('@babel/types');
import { launch } from 'puppeteer';
import { email, pass } from './creds.js';
import { emitter } from './eventEmitter.js';
import { Game, parseFrame } from './poko.js';
import express from 'express';
import { createServer } from 'http';
// import cors from 'cors';
import { Server } from 'socket.io';

// starts local server
const app = express();
const server = createServer(app);
const io = new Server( server, { cors : { origin : '*' } });

app.set('view engine', 'ejs');
server.listen(3000);
app.get('/', (req, res) => {
    res.render('index');
})

var curGame;

/*-----------------------------------------------------------------------
*
*   facilitates server websocket activity
*
*-------------------------------------------------------------------------*/
io.on('connection', (socket) => {
    
    socket.on( 'initialize', ( ) => {
        initGame( );
    });


    //
    //  returns notable hands for selected player
    //
    socket.on( 'GET_HANDS', ( seat ) => {
        console.log( parseInt( seat ) );

        if ( curGame == undefined || curGame.mySeat == undefined )
            return;

        let playerNo = ( curGame.mySeat + parseInt( seat ) ) % 9;
        console.log( 'getting hand for player: ' + playerNo);

        if ( curGame.players[ playerNo ] == null )
            socket.emit( 'RETURN_HANDS', JSON.stringify( curGame.players[ playerNo ].bigHands ) );
    });

    emitter.on( 'TABLE_UPDATE', ( ) => {
        if (curGame.mySeat == null) return;
        
        let presentPlayers = [ null, null, null, null, null, null, null, null, null ];

        for ( let i = 0; i < 9; i++ ){
            let plr = curGame.players[ i ];
            if ( plr != null )
                presentPlayers[ ( i - curGame.mySeat + 9 ) % 9 ] = {
                    seat: curGame.tournament ? plr.id : i,
                    vpip : Math.round( 10000 * plr.stats.pre.vpip / plr.stats.hands ) / 100,
                    pfr : Math.round( 10000 * plr.stats.pre.raisins / plr.stats.hands ) / 100,
                    agg : Math.round( 10000 * plr.stats.post.raisins / plr.stats.post.calls ) / 100,
                    bbwpohh : Math.round( 10000 * ( plr.stack - plr.stats.boughtIn ) / ( curGame.hand.bbVal * plr.stats.hands ) ) / 100,
                    hands : plr.stats.hands
                };
        }
    
        // console.log('sending update message' + JSON.stringify(presentPlayers));
        socket.emit( 'TABLE_UPDATE', JSON.stringify( presentPlayers ));
    });

    emitter.on( 'ACTION_UPDATE', ( start, end, str ) => {
        let msg = { street: str, data: {} };
        console.log('acted')
        console.log(`start: ${start}, end: ${end}, str: ${str}`)

        // for making sure I got it right
        console.log( ' first turn: ' + curGame.hand.timeline[ start ].player + curGame.hand.timeline[ start ].action );

        for ( let i = start; i < end; i++ ){
            let turn = curGame.hand.timeline[ i ];
            if ( turn.player === 'board' )
                continue;

            let seat = ( turn.player - curGame.mySeat + 9 ) % 9;


            if ( msg.data[ seat ] === undefined ){
                msg.data[ seat ] = [ { act: turn.action, amt: turn.amount } ];
            }
            else{
                msg.data[ seat ].push( { act: turn.action, amt: turn.amount } );
            }
        }

        console.log( 'action: ' + JSON.stringify( msg ));
        socket.emit( 'ACTION_UPDATE', JSON.stringify( msg ));
    });

});

/*-----------------------------------------------------------------------
*
*   Opens puppeteer window and begins monitoring websocket activity
*
*-------------------------------------------------------------------------*/
async function initGame() 
{
    const browser = await launch({
        headless: false, 
        defaultViewport: null,
        devtools: false,
    });
    const page = await browser.newPage();

    const client = await page.target().createCDPSession();

    await client.send('Network.enable');

    await page.goto('https://www.bovada.lv/poker?overlay=login', { waitUntil: 'networkidle0' });


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
            

        } catch( error ) {
            // console.log(error);
        }
    })



    // await page.type('input#email', credentials.email);
    // await page.type('input#login-password', credentials.pass); 

    // await page.click('button#login-submit');
    // await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // await page.goto('https://www.bovada.lv/poker/poker-lobby/home');
    
    
    // await page.waitForNavigation({waitUntil: 'networkidle0',});
    
    //                       join table
    

}
