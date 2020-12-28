var Tetris = (() => {
    // Divs container pour le plateau de jeu et la fiche de score
    var playField = null;
    var nextTetroField = null;
    var scoreField = null;
    var linesField = null;
    var levelField = null;

    // Boutons pour les contrôles
    var leftButton = null;
    var leftRotButton = null;
    var rightButton = null;
    var rightRotButton = null;
    var downButton = null;

    /****************************************************
     * Réglages principaux                              *
     ****************************************************/

    // Contrôle du jeu
    var isGameOver = false;
    var tetroFallDelay = 1000;
    var isKeyDown = false;
    var fallCallback = null;

    // Taille du terrain de jeu
    var fieldCols = null;
    var fieldRows = null;

    // Données du terrain de jeu
    var pfData = [];

    // Largeur du block
    var blockWidth = 0;

    // Pièce en cours
    var currentTetro = null;
    var currentTetroRot = null;
    var currentTetroX = null;
    var currentTetroY = null;
    var nextTetro = null;

    // Définition des tetrominos
    const tetro = [
        // I
       [0, 0, 1, 0,
        0, 0, 1, 0,
        0, 0, 1, 0,
        0, 0, 1, 0],
        // J
       [0, 0, 1, 0,
        0, 0, 1, 0,
        0, 1, 1, 0,
        0, 0, 0, 0],
        // L
       [0, 1, 0, 0,
        0, 1, 0, 0,
        0, 1, 1, 0,
        0, 0, 0, 0],
        // O
       [0, 0, 0, 0,
        0, 1, 1, 0,
        0, 1, 1, 0,
        0, 0, 0, 0],
        // S
       [0, 1, 0, 0,
        0, 1, 1, 0,
        0, 0, 1, 0,
        0, 0, 0, 0],
        // Z
       [0, 0, 1, 0,
        0, 1, 1, 0,
        0, 1, 0, 0,
        0, 0, 0, 0],
        // T
       [0, 0, 1, 0,
        0, 1, 1, 0,
        0, 0, 1, 0,
        0, 0, 0, 0]
    ];

    /**
     * Permet de rajouter des points au score du joueur
     * @param {int} points Points à rajouter au score
     */
    function scorePoints(points) {
        scoreField.textContent = parseInt(scoreField.textContent) + points;
    }

    /**
     * Permet de vérifier si des lignes ont été réalisées
     */
    function checkLines() {
        // On recherche d'abord les lignes
        let rowsToRemove = [];
        for (let y = 10; y < fieldRows - 1; y++) {
            let hasLine = true;
            for (let x = 1; x < fieldCols - 1; x++) {
                if (pfData[x + y * fieldCols] == 0) {
                    hasLine = false;
                }
            }
            if (hasLine) {
                rowsToRemove.push(y);
            }
        }
        // Si il y a des lignes à enlever, on le fait
        if (rowsToRemove.length) {
            // On calcule d'abord le bonus
            let pointsScored = ((50 + (50 * parseInt(levelField.textContent))) * rowsToRemove.length) * rowsToRemove.length;
            let hasPassedLevel = false;
            for (let rowToRemove of rowsToRemove) {
                for (let x = 1; x < fieldCols - 1; x++) {
                    // On met la case à zéro
                    pfData[x + rowToRemove * fieldCols] = 0;
                    // Et on fait tomber les blocs
                    for (let y = rowToRemove - 1; y >= 0; y--) {
                        pfData[x + (y + 1) * fieldCols] = pfData[x + y * fieldCols];
                    }
                }
                linesField.textContent = parseInt(linesField.textContent) + 1;
                // On monte d'un niveau toute les 10 lignes
                if (!(parseInt(linesField.textContent) % 10)) {
                    hasPassedLevel = true;
                }
            }
            scorePoints(pointsScored);
            // On monte d'un niveau toute les 10 lignes
            if (hasPassedLevel) {
                levelField.textContent = parseInt(levelField.textContent) + 1;
                // Et on diminue le delai de chute des pièces de 5%
                tetroFallDelay = tetroFallDelay * 0.95;
                // On arrête et relance le timer avec le nouveau delai
                window.clearInterval(fallCallback);
                window.setInterval(tetroFall, tetroFallDelay);
            }
        }
    }

    /**
     * Fais du prochain tetromino le tetromino en cours, et crée le suivant. 
     */
    function newTetro() {
        currentTetro = nextTetro;
        nextTetro = Math.floor(Math.random() * 7) + 1;
        currentTetroRot = Math.floor(Math.random() * 4);
        currentTetroX = fieldCols / 2 - 2;
        currentTetroY = 9;
        if (!canPlaceTetro(currentTetroX, currentTetroY, currentTetroRot)) {
            // Impossible de placer le nouveau tetro : donc fin de jeu
            window.clearInterval(fallCallback);
            isGameOver = true;
            nextTetroField.innerHTML = 'GAME OVER';
        }
    }

    /**
     * Fonction callback qui fait tomber naturellement la pièce.
     */
    function tetroFall() {
        moveTetro('down', null, true);
    }

    /**
     * Permet de faire tourner un tetromino selon une rotation donnée.
     * @param {array} tetroToRotate Le tetromino à tourner, dans sa position par défaut
     * @param {int} rotation Le type de rotation à effectuer
     */
    function rotate(tetroToRotate, rotation) {
        let rotatedTetro = [];
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                switch (rotation) {
                    case 0:
                        // Aucune rotation
                        rotatedTetro[x + y * 4] = tetroToRotate[x + y * 4];
                        break;
                    case 1:
                        // 90° sens horaire
                        rotatedTetro[x + y * 4] = tetroToRotate[12 + y - (x * 4)];
                        break;
                    case 2:
                        // 180° sens horaire
                        rotatedTetro[x + y * 4] = tetroToRotate[15 - (y * 4) - x];
                        break;
                    case 3:
                        // 270° sens horaire
                        rotatedTetro[x + y * 4] = tetroToRotate[3 - y + (x * 4)];
                        break;
                    default:
                        break;
                }
            }
        }
        return rotatedTetro;
    }

    /**
     * Permet de déplacer un tetromino.
     * @param {string} action L'action a effectuer
     * @param {Event} keyEvent Si c'est une touche du clavier qui a été appuyé, permet de récupérer la touche appuyée
     * @param {bool} isCallback Mise à true par le callback pour indiquer que la pièce tombe
     */
    function moveTetro(action, keyEvent = null, isCallback = false) {
        // On ne bouge pas si le tetro est en train de tomber
        if (!isKeyDown && !isGameOver) {
            let nextTetroX = currentTetroX;
            let nextTetroY = currentTetroY;
            let nextTetroRot = currentTetroRot;

            let willStick = false;

            if (keyEvent) {
                // Gestion touches du clavier
                switch (keyEvent.key) {
                    case 'Escape':
                        console.log('Escape');
                        if (fallCallback) {
                            window.clearInterval(fallCallback);
                            fallCallback = null;
                        }
                        else {
                            fallCallback = window.setInterval(tetroFall, tetroFallDelay);
                        }
                        break;
                    case 'q':
                    case 'Q':
                        nextTetroX--;
                        break;
                    case 'a':
                    case 'A':
                        isKeyDown = true;
                        nextTetroRot--;
                        if (nextTetroRot < 0) {
                            nextTetroRot = 3;
                        }
                        break;
                    case 'd':
                    case 'D':
                        nextTetroX++;
                        break;
                    case 'e':
                    case 'E':
                        isKeyDown = true;
                        nextTetroRot++;
                        if (nextTetroRot > 3) {
                            nextTetroRot = 0;
                        }
                        break;
                    case 's':
                    case 'S':
                        nextTetroY++;
                        break;
                    default:
                        break;
                }
            }
            else {
                // Gestion boutons de l'interface
                switch (action) {
                    case 'left':
                        nextTetroX--;
                        break;
                    case 'rotleft':
                        nextTetroRot--;
                        if (nextTetroRot < 0) {
                            nextTetroRot = 3;
                        }
                        break;
                    case 'right':
                        nextTetroX++;
                        break;
                    case 'rotright':
                        nextTetroRot++;
                        if (nextTetroRot > 3) {
                            nextTetroRot = 0;
                        }
                        break;
                    case 'down':
                        nextTetroY++;
                        break;
                    default:
                        break;
                }
            }
            // Peut on placer ce tetro à cet endroit ?
            // On met d'abord des 0 à l'emplacement de la pièce
            placeTetro(false);
            if (canPlaceTetro(nextTetroX, nextTetroY, nextTetroRot)) {
                currentTetroX = nextTetroX;
                currentTetroY = nextTetroY;
                currentTetroRot = nextTetroRot;
                if ((action == 'down') && (!isCallback)) {
                    // On rajoute 10 points par lignes quand on fait descendre volontairement la pièce
                    scorePoints(10);
                }
                placeTetro();
            }
            else {
                if (keyEvent) {
                    if ((keyEvent.key == 's') || (keyEvent.key == 'S')) {
                        willStick = true;
                    }
                }
                else {
                    if (action == 'down') {
                        willStick = true;
                    }
                }
                if (willStick) {
                    // La pièce s'accroche
                    placeTetro();
                    // On rajoute 50 points pour avoir collé la pièce
                    scorePoints(50);
                    checkLines();
                    newTetro();
                }
                else {
                    placeTetro();
                }
            }
        }
    }

    /**
     * Permet de vérifier si on peut place le tetromino à cet endroit.
     * @param {int} xToCheck La position X du tetromino à vérifier
     * @param {int} yToCheck La position Y du tetromino à vérifier
     * @param {int} rotToCheck La rotation à appliquer au tetromino en cours de vérification
     */
    function canPlaceTetro(xToCheck, yToCheck, rotToCheck) {
        let tetroArray = rotate(tetro[currentTetro - 1], rotToCheck);
        let canPlace = true;
        check:
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (tetroArray[x + y * 4] != 0) {
                    if (pfData[xToCheck + x + (yToCheck + y) * fieldCols] != 0) {
                        canPlace = false;
                        break check;
                    }
                }
            }
        }
        return canPlace;
    }

    /**
     * Permet d'afficher ou de masquer un tetromino.
     * @param {bool} show Toggle pour afficher ou cacher le tetromino
     */
    function placeTetro(show = true) {
        let tetroArray = rotate(tetro[currentTetro - 1], currentTetroRot);
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (tetroArray[x + y * 4] != 0) {
                    pfData[currentTetroX + x + (currentTetroY + y) * fieldCols] = show ? currentTetro : 0;
                }
            }
        }
        renderPlayField();
    }

    /**
     * Dessine le terrain de jeu.
     */
    function renderPlayField() {
        // On vide le terrain de jeu
        playField.innerHTML = '';
        // Début du parcours du tableau de jeu
        for (let row = 0; row < fieldRows; row++) {
            for (let col = 0; col < fieldCols; col++) {
                // On n'affiche pas les 10 premières lignes
                if (row > 9) {
                    // Création du bloc à afficher
                    let block = document.createElement('div');
                    block.style.position = 'absolute';
                    block.style.width = blockWidth + 'px';
                    block.style.height = blockWidth + 'px';
                    block.style.top = (blockWidth * (row - 10)) + 'px';
                    block.style.left = (blockWidth * col) + 'px';
                    block.classList.add('tetromino')

                    // Sélection de la pièce à afficher
                    block.classList.add('tetromino' + pfData[col + fieldCols * row]);
                    
                    // Rajout du bloc
                    playField.appendChild(block);
                }
            }
        }
    }

    /**
     * Redimensionne le terrain de jeu pour qu'il ne dépasse pas de son container.
     * Appelé en callback de window.resize
     */
    function resizePlayField() {
        let pfWidth = playField.parentElement.clientWidth;
        let pfHeight = playField.parentElement.clientHeight;

        // on va d'abord vérifier le ratio du terrain de jeu
        if (pfHeight >= ((fieldRows - 10) / fieldCols) * (pfWidth / fieldCols) * fieldCols) {
            // Il reste de la marge en bas : la zone de jeu devra s'adapter pour prendre toute la largeur
            blockWidth = pfWidth / fieldCols;
        }
        else {
            // La zone dépasse en hauteur : elle devra s'adapter en largeur pour occuper toute la hauteur
            blockWidth = pfHeight / (fieldRows - 10);
        }

        // On redimensionne
        playField.style.height = (blockWidth * (fieldRows - 10)) + 'px';
        playField.style.width = (blockWidth * fieldCols) + 'px';
        playField.style.border = 'solid 1px black';

        // Et on redessine
        renderPlayField();
    }

    /**
     * Permet de renseigner le div dans lequel le terrain de jeu sera affiché.
     * Mesure par défaut 10 colonnes par 24 lignes (+10 cachées au dessus).
     * DOIT être appelé.
     * @param {Element} playDiv Le div ou apparaitra le terrain de jeu
     * @param {int} fc La largeur du terrain de jeu, en colonnes
     * @param {int} fr La hauteur du terrain de jeu, en lignes
     */
    function setPlayField(playDiv, nextTetroDiv, fc = 10, fr = 24) {
        playField = playDiv;
        nextTetroField = nextTetroDiv;
        // On rajoute 1 bloc de chaque côté pour délimiter le terrain de jeu
        fieldCols = fc + 2;
        // On rajoute 10 lignes pour la zone cachée nécessaire pour stocker les pièces empilées au dessus de la zone de jeu visible.
        // Lorsqu'une ligne ou plusieurs lignes sont réalisées, elle réapparaitront quand les pièces tomberont.
        fieldRows = fr + 10;


        // Initialisation du terrain de jeu
        playField.style.margin = 'auto';
        playField.style.position = 'relative';
        playField.style.overflow = 'hidden';

        // Remplissage initial
        for (let row = 0; row < fieldRows; row++) {
            for (let col = 0; col < fieldCols; col++) {
                if ((col == 0) || (col == (fieldCols - 1)) || (row == (fieldRows - 1))) {
                    // On met des tetromino noirs sur les bords et le bas du terrain de jeu
                    pfData.push(8);
                }
                else {
                    // On laisse l'espace vide pour le reste
                    pfData.push(0);
                }
            }
        }
        
        // On peut maintenant initialiser le terrain de jeu
        resizePlayField();
        // La fonction est mise en callback pour l'événement window.resize
        window.onresize = resizePlayField;
    }

    /**
     * Permet de renseigner les div qui contiendront le score et le niveau actuel
     * DOIT être appelé.
     * @param {Element} scoreDiv L'élément DOM contenant le score : son textContent sera remplacé
     * @param {Element} levelDiv L'élément DOM contenant le niveau en cours : son textContent sera remplacé
     */
    function setStatBoard(scoreDiv, linesDiv, levelDiv) {
        scoreField = scoreDiv;
        linesField = linesDiv;
        levelField = levelDiv;
    }

    /**
     * Permet de renseigner les boutons de commande
     * DOIT être appelé.
     * @param {Element} lBtn Le bouton Gauche
     * @param {Element} lrBtn Le bouton pour tourner la pièce vers la gauche
     * @param {Element} rBtn Le bouton Droit
     * @param {Element} rrBtn Le bouton pour tourner la pièce vers la droite
     * @param {Element} dBtn Le bouton Bas
     */
    function setControls(lBtn, lrBtn, rBtn, rrBtn, dBtn) {
        leftButton = lBtn;
        leftRotButton = lrBtn;
        rightButton = rBtn;
        rightRotButton = rrBtn;
        downButton = dBtn;
        // Ajout des listener
        leftButton.addEventListener('click', () => {
            moveTetro('left');
        });
        leftRotButton.addEventListener('click', () => {
            moveTetro('rotleft');
        });
        rightButton.addEventListener('click', () => {
            moveTetro('right');
        });
        rightRotButton.addEventListener('click', () => {
            moveTetro('rotright');
        });
        downButton.addEventListener('click', () => {
            moveTetro('down');
        });
        document.addEventListener('keydown', (event) => {
            moveTetro('key', event);
        });
        document.addEventListener('keyup', (event) => {
            isKeyDown = false;
        });
    }

    /**
     * Démarre le jeu
     */
    function startGame() {
        // Initialisation du jeu
        nextTetro = Math.floor(Math.random() * 7) + 1;
        newTetro();

        placeTetro();

        fallCallback = window.setInterval(tetroFall, tetroFallDelay);
    }

    return {
        setPlayField:  setPlayField,
        setScoreField: setStatBoard,
        setControls:   setControls,
        startGame:     startGame
    }
}
)();