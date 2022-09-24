// const { moduleExpression } = require('@babel/types');
import { launch } from 'puppeteer';
import { email, pass } from './creds.js';
import { emitter } from './eventEmitter.js';
import { Game, parseFrame } from './poko.js';
var curGame;

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { endianness } from 'os';

const app = express();
const server = createServer(app);
const io = new Server( server, { cors : { origin : '*' } });

app.set('view engine', 'ejs');

server.listen(3000);

app.get('/', (req, res) => {
    res.render('index');
})

io.on('connection', (socket) => {
    
    socket.on( 'initialize', ( ) => {
        initGame( );
    });

    socket.on( 'GET_HANDS', ( msg ))

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
                    bbwpohh : Math.round( 10000 * ( plr.stack - plr.bought ) / ( curGame.hand.bbVal * plr.stats.hands ) ) / 100,
                    hands : plr.stats.hands
                };
        }
    
        // console.log('sending update message' + JSON.stringify(presentPlayers));
        socket.emit( 'TABLE_UPDATE', JSON.stringify( presentPlayers ));
    });

    emitter.on( 'ACTION_UPDATE', ( start, end ) => {
        let msg = { street: str, data: {} };

        for ( let i = start; i < end; i++ ){
            let turn = curGame.hand.timeline[ i ];

            if ( msg.data[ turn.player ] === undefined ){
                msg.data[ turn.player ] = [ { act: turn.action, amt: turn.amount } ];
            }
            else{
                msg.data[ turn.player ].push( { act: turn.action, amt: turn.amount } );
            }
        }

        console.log( 'action: ' + JSON.stringify( msg ));
        socket.emit( 'ACTION_UPDATE', JSON.stringify( msg ));
    });

});


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
