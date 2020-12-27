var Tetris = ( () => {
    // Divs container pour le plateau de jeu et la fiche de score
    var gameField = null;
    var scoreField = null;

    // Boutons pour les contrôles
    var leftButton = null;
    var leftRotButton = null;
    var rightButton = null;
    var rightRotButton = null;
    var downButton = null;


    function setGameField(fieldDiv) {
        gameField = fieldDiv;
    }

    function setScoreField(scoreDiv) {
        scoreField = scoreDiv;
    }

    function setControls(lBtn, lrBtn, rBtn, rrBtn, dBtn) {
        leftButton = lBtn;
        leftRotButton = lrBtn;
        rightButton = rBtn;
        rightRotButton = rrBtn;
        downButton = dBtn;
    }

    function startGame() {
        console.log('start !');
    }

    return {
        setGameField:  setGameField,
        setScoreField: setScoreField,
        setControls:   setControls,
        startGame:     startGame
    }
}
)();