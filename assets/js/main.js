Tetris.setPlayField(document.getElementById('playfield'), document.getElementById('next-tetro'));
Tetris.setScoreField(document.getElementById('scorefield'), document.getElementById('linesfield'), document.getElementById('levelfield'));
Tetris.setControls(document.getElementById('leftMove'),
                   document.getElementById('leftRot'),
                   document.getElementById('rightMove'),
                   document.getElementById('rightRot'),
                   document.getElementById('downMove'),);
Tetris.startGame();