a readme should be here


Need a file called creds.js that contains the following:

const email = email for bovada.com;
const pass = password;

module.exports = [ email, pass ];



ToDo:

tournament
changing tables
display player IDs on tournament mode


cash
--------------------------------------------------
- side pots
-how do rebuys work ( PLAY_BUYIN_INFO?)
-card shows for showdowns
-display hands played
-multiple table functionality

low prio:



CO_SELECT_REQ               indicates your turn



CO_TABLE_STATE = 2          ( probably signifies start of hand )
CO_DEALER_SEAT              ( sometimes is sent twice )         
CO_TABLE_STATE = 4          (  )
CO_BLIND_INFO               ( sometimes no small blind? )
CO_TABLE_STATE = 8          (  )
CO_CARDTABLE_INFO           ( includes playing seats )
// preflop betting //
CO_CHIPTABLE_INFO           ( pot and rake )
CO_TABLE_STATE = 16         (  )
CO_BCARD3_INFO
// betting //
CO_CHIPTABLE_INFO           ( pot and rake )
CO_TABLE_STATE = 32         (  )
CO_BCARD1_INFO
// betting //
CO_CHIPTABLE_INFO           ( pot and rake )
CO_TABLE_STATE = 64         (  )
CO_BCARD1_INFO
// betting //
CO_CHIPTABLE_INFO           ( pot and rake )
CO_TABLE_STATE = 32768

(repeated for every player who shows)
CO_PCARD_INFO               ( shown opponent cards )
CO_SHOW_INFO

CO_TABLE_STATE = 65536
CO_RESULT_INFO              ( ending stacks and handHi? )
CO_POT_INFO                 ( winnings, does this include return bets? )



PLAY_CLEAR_INFO             ( probably marks end of hand )

