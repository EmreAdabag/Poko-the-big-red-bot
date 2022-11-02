import { exec } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';




function alterInput( inFile, outFile = inFile, category, newInput ){
    let data = readFileSync( inFile, 'utf-8' );
    let newVal = data.replace( category, newInput );

    writeFileSync( outFile, newVal, 'utf-8' );
}

function runSolve(  ){
    exec('../TexasSolver-v0.2.0-MacOs/console_solver -i ./solverfiles/input.txt', ( error, stdout, stderr ) => {
        if ( error ){
            console.log( `error: ${error.message}` );
            return;
        }
        if ( stderr ) { console.log(stderr); }
        if ( stdout ) { console.log(stdout); }
    });
}


// overwriteInput( 'test.txt', /test.*/, 'pets' );