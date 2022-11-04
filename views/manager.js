    
const playerhtml = `
<h3 class = no></h3>
<h4 class = vpip></h4>
<h4 class = pfr></h4>
<h4 class = agg></h4>
<h4 class = bbwpohh></h4>
<h4 class = hands></h4>
<div style="clear: both">
    <h4 style="float: left" class="preflop" ></h4>
    <h4 style="float: left" class="flop"></h4>
    <h4 style="float: right" class="turn"></h4>
</div>`


const handhtml = `
<div class="clearfix" id="hand{handidx}" >
    <div class="handview" style="background-color:rgb(255, 109, 109)">
        <div class="handcards" style="float: left; padding: 20px;">
            <h3 style="top: 0%;">HAND</h3>
            <h5 class="actualhand"></h5>
            <h3 style="top: 0%;">Player no.</h3>
            <h5 class="actualpos"></h5>
        </div>
        <div style="float: left; padding: 20px;">
            <ul class="pf">
            </ul>
        </div>
        <div class="flopcards" style="float: left; padding: 20px;">
            <h3 style="top: 0%;">FLOP</h3>
            <h4 class="actualflop"></h4>
        </div>
        <div style="float: left; padding: 20px;">
            <ul class="flop">
            </ul>
        </div>
        <div class="turncard" style="float: left; padding: 20px;">
            <h3 style="top: 0%;">TURN</h3>
            <h4 class="actualturn"></h4>
        </div>
        <div style="float: left; padding: 20px;">
            <ul class="turn">
            </ul>
        </div>
        <div class="rivercard" style="float: left; padding: 20px;">
            <h3 style="top: 0%;">RIVER</h3>
            <h4 class="actualriver"></h4>
        </div>
        <div style="float: left; padding: 20px;">
            <ul class="river">
            </ul>
        </div>
    </div>
</div>`

for ( let i = 0; i < 9; i++ ){
    document.querySelector( '#s' + i ).innerHTML = playerhtml;
}

const socket = io('http://localhost:3000');

socket.on( 'TABLE_UPDATE', ( msg ) => {

    console.log(msg);
    let data = JSON.parse( msg );

    data.forEach( (stats, player) => {
        if ( stats == null ) {
            document.querySelector( `#s${player}` ).innerHTML = playerhtml;
            return;    
        };

        document.querySelector( `#s${player} .no` ).textContent = 'Player ' + ( stats.seat + 1 );
        document.querySelector( `#s${player} .vpip` ).textContent = 'VPIP: ' + ( stats.vpip != null ? stats.vpip : '' );
        document.querySelector( `#s${player} .pfr` ).textContent = 'PFR: ' + ( stats.pfr != null ? stats.pfr : '' );
        document.querySelector( `#s${player} .agg` ).textContent = 'AF: ' + ( stats.agg != null ? stats.agg : '' );
        document.querySelector( `#s${player} .bbwpohh` ).textContent = 'bbwpohh: ' + ( stats.bbwpohh != null ? stats.bbwpohh : '' );
        document.querySelector( `#s${player} .hands` ).textContent = 'hands: ' + ( stats.hands != null ? stats.hands : '' );
        document.querySelector( `#s${player} .preflop` ).textContent = '';
        document.querySelector( `#s${player} .flop` ).textContent = '';
        document.querySelector( `#s${player} .turn` ).textContent = '';
    })
});

socket.on( 'ACTION_UPDATE', ( msg ) => {
    console.log(msg);
    let parsedmsg = JSON.parse( msg );
    let street = parsedmsg.street;
    let data = parsedmsg.data;

    for ( const [ seat, turns ] of Object.entries( data ) ){
        let str = '';

        turns.forEach( (turn) => {
            str += `${turn.act}${turn.amt > 0 ? turn.amt : ''} `;
        })
        console.log(`seat: ${seat}, street: ${street}`)
        console.log(str)
        document.querySelector( `#s${seat} .${street}` ).textContent = ` ${street}: ${str}`;
    }
    
});

const testfn = () => {
    let playerno = 0
    hands = [[{'player':'board', 'action':'cards!!!!!'}],[{'player':'board', 'action':'cards!!!!!'}]]
    let playerhand = 'askljdhfasdjklahjsdf'
    hands.forEach( (hand, idx) => {
        let newhtml = handhtml.replace('{handidx}', idx);
        console.log('new html')
        console.log(newhtml)
        document.getElementById("overlay").innerHTML += newhtml;
        parsehand( playerno, playerhand, hand, idx);
    })
}

function parsecard(card){
    return String(card)
}

function parsehand( pno, pcards, tl, idx ){

    // console.log(`parsing playerno : ${pno} cards : ${pcards} idx : ${idx}`)
    let flopbc = null;
    let turnbc = null;
    let riverbc = null;


    let handcards_selector = document.querySelector(`#hand${idx} .actualhand`)
    let pos_selector = document.querySelector(`#hand${idx} .actualpos`)
    let pf_selector = document.querySelector(`#hand${idx} .pf`)
    let flopcards_selector = document.querySelector(`#hand${idx} .actualflop`)
    let flop_selector = document.querySelector(`#hand${idx} .flop`)
    let turncard_selector = document.querySelector(`#hand${idx} .actualturn`)
    let turn_selector = document.querySelector(`#hand${idx} .turn`)
    let rivercard_selector = document.querySelector(`#hand${idx} .actualriver`)
    let river_selector = document.querySelector(`#hand${idx} .river`)

    handcards_selector.appendChild(document.createTextNode(pcards))
    pos_selector.appendChild(document.createTextNode(pno+1))

    for (const turn of tl){
        if ( flopbc === null && turn.player === 'board' ){
            let flopbc = '';
            // turn.amount.forEach( card => {
            //     flopbc += parsecard(card) + ' ';
            // })
            flopcards_selector.appendChild(document.createTextNode(String(turn.amount)))            
            continue;
        }
        else if ( turnbc === null && turn.player === 'board' ){
            turnbc = parsecard(turn.amount);
            turncard_selector.appendChild(document.createTextNode(String(turn.amount)))
            continue;
        }
        else if ( riverbc  === null && turn.player === 'board' ){
            riverbc = parsecard(turn.amount);
            rivercard_selector.appendChild(document.createTextNode(String(turn.amount)))
            continue;
        }
        
        let li = document.createElement("li");
        newturn = `P${turn.player+1}: ${turn.action} ${turn.amount}`
        li.appendChild(document.createTextNode(newturn));

        if (flopbc === null){
            pf_selector.appendChild(li)  
        }
        else if (turnbc === null){
            flop_selector.appendChild(li)
        }
        else if (riverbc === null){
            turn_selector.appendChild(li)
        }
        else{
            river_selector.appendChild(li)
        }
    }
}

socket.on( 'RETURN_HANDS', ( msg ) => {
    console.log(msg);
    let hands = JSON.parse( msg );

    hands.forEach( (hand, idx) => {
        let newhtml = handhtml.replace('{handidx}', idx)
        document.getElementById("overlay").innerHTML += newhtml;
        parsehand( hand.pno, hand.pcards, hand.timeline, idx);
    })
    overlayon();
});

function overlayon(){
    document.getElementById("overlay").style.display = "block"
}

function overlayoff(){
    document.getElementById("overlay").innerHTML = '';
    document.getElementById("overlay").style.display = "none";1
}

const enterGame = ( ) => {
    document.getElementById('enterbutton').remove()
    socket.emit( 'initialize' );
}

const getHands = ( seat ) => {
    socket.emit( 'GET_HANDS', String( seat ) )
}

