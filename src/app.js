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

const app = express();
const server = createServer(app);
const io = new Server( server, { cors : { origin : '*' } });

app.set('view engine', 'ejs');

server.listen(3000);

app.get('/', (req, res) => {
    res.render('index');
})

io.on('connection', (socket) => {
    
    socket.on('initialize', ( ) => {
        initGame( );
    })

    // fill these in
    emitter.on( 'pF', ( plr ) => {
        socket.emit( 'NEW_STAT', JSON.stringify({ seat : ( seat - curGame.mySeat + 9 ) % 9, data : {  } }) )
    });


    emitter.on( 'pR', ( seat ) => {
        socket.emit( 'NEW_STAT', JSON.stringify({ seat : ( seat - curGame.mySeat + 9 ) % 9, data : {  } }) )
    });


    emitter.on( 'V', ( seat ) => {
        socket.emit( 'NEW_STAT', JSON.stringify({ seat : ( seat - curGame.mySeat + 9 ) % 9, data : { vpip : Math.round( 10000 * plr.stats.pre.vpip / plr.stats.hands ) / 100 } }) )
    });


    emitter.on( 'F', ( seat ) => {
        socket.emit( 'NEW_STAT', JSON.stringify({ seat : ( seat - curGame.mySeat + 9 ) % 9, data : {  } }) )
    });


    emitter.on( 'C', ( seat ) => {
        socket.emit( 'NEW_STAT', JSON.stringify({ seat : ( seat - curGame.mySeat + 9 ) % 9, data : {  } }) )
    });


    emitter.on( 'R', ( seat ) => {
        socket.emit( 'NEW_STAT', JSON.stringify({ seat : ( seat - curGame.mySeat + 9 ) % 9, data : {  } }) )
    });


    emitter.on( 'W', ( seat ) => {
        socket.emit( 'NEW_STAT', JSON.stringify({ seat : ( seat - curGame.mySeat + 9 ) % 9, data : {  } }) )
    });

    emitter.on( 'TABLE_UPDATE', ( seat, joined ) => {
        socket.emit( 'TABLE_UPDATE', JSON.stringify({ seat : ( seat - curGame.mySeat + 9 ) % 9, id : seat + 1, joined : joined }) );
    });


    // emre remember this when loading in breaks on tournment mode
    // table initialization sent to client when your seat is received
    // tournament mode mySeat != cash game mySeat
    emitter.on( 'TABLE_INIT', (  ) => {
        if ( curGame.mySeat == null ){
            console.log('Trouble initializing the table, close the window and try again');
        }

        presentPlayers = [ null, null, null, null, null, null, null, null, null ];

        for ( let i = 0; i < 9; i++ ){
            if ( curGame.players[ ( mySeat + i ) % 9 ] != null )
                presentPlayers[ i ] = ( mySeat + i ) % 9;
        }

        socket.emit( 'TABLE_INIT', JSON.stringify( presentPlayers ) );
    });

    emitter.on( 'END_HAND', (  ) => {
        let msg = {};

        for ( const [ index, player ] in curGame.players ){
            
            if ( player == null ){
                continue;
            }
            
            msg[ 's' + ( index - curGame.mySeat + 9 ) % 9 ] = {
                vpip : Math.round( 10000 * plr.stats.pre.vpip / plr.stats.hands ) / 100,
                pfr : Math.round( 10000 * plr.stats.pre.pfr / plr.stats.hands ) / 100,
                agg : 1,        // implement this EMRE
                bbwpohh : 1     // implement this EMRE
            }
        }

        socket.emit( 'END_HAND', JSON.stringify( msg ));
    });


    // let curStats = [];
    // let playerCodes = [ 'p1','p2','p3','p4','p5','p6','p7','p8','p9' ];
    
    // function updatePage(  ){

    //     if ( curGame == null || curGame.players.every( element => element == null ) ){

    //         socket.emit( 'update', 'inactive');

    //     }
    //     else{

    //         for ( let i = 0; i < 9; i++ ){
                
    //             let plr = curGame.players[ ( curGame.mySeat + i ) % 9 ];
                
    //             if ( plr == null ){
    //                 curStats[ i ] = null;
    //                 continue;
    //             }
                    

    //             curStats[ i ] =
    //             {
    //                 no : ( curGame.mySeat + i ) % 9,
    //                 vpip : Math.round( 10000 * plr.stats.pre.vpip / plr.stats.hands ) / 100,
    //                 pfr : Math.round( 10000 * plr.stats.pre.pfr / plr.stats.hands ) / 100,
    //                 agg : '',                         // EMRE implemenet
    //                 bbwpohh : ''                      // EMRE implemenet
    //             }

    //         }

    //         socket.emit( 'update', JSON.stringify( curStats ) );
    //     }
            
    // }

});


async function initGame() 
{
    const browser = await launch({
        headless: false, 
        defaultViewport: null,
        devtools: false,
    });
    const page = await browser.newPage();       // does this add extra tab?

    const client = await page.target().createCDPSession();


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

    await client.send('Network.enable');

    await page.goto('https://www.bovada.lv/poker?overlay=login', { waitUntil: 'networkidle0' });

    // await page.type('input#email', credentials.email);
    // await page.type('input#login-password', credentials.pass); 

    // await page.click('button#login-submit');
    // await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // await page.goto('https://www.bovada.lv/poker/poker-lobby/home');
    
    
    // await page.waitForNavigation({waitUntil: 'networkidle0',});
    
    //                       join table
    

}
