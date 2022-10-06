export const actions = { 
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

export const phases = {
    2 : "X",        // PRE-PREFLOP
    8 : "P",        // PREFLOP
    16 : "F",       // FLOP
    32 : "T",       // TURN
    64 : "R"        // RIVER
}


export const seats = { "seat1" : 0, 
                "seat2" : 1, 
                "seat3" : 2, 
                "seat4" : 3, 
                "seat5" : 4, 
                "seat6" : 5, 
                "seat7" : 6, 
                "seat8" : 7, 
                "seat9" : 8};