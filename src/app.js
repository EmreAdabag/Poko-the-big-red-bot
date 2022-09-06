const { moduleExpression } = require('@babel/types');
const puppeteer = require('puppeteer');
const credentials = require('./creds')
const {Game, parseFrame} = require('../src/poko.js');



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

    await page.goto('https://www.bovada.lv/poker/poker-lobby/home');
    await page.waitForNavigation({waitUntil: 'networkidle0',});
    
    //                       join table


}

main();