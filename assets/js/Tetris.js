let Tetris = (() => {
    // Divs container pour le plateau de jeu et la fiche de score
    let playField = null;
    let nextTetroField = null;
    let scoreField = null;
    let linesField = null;
    let levelField = null;

    // Boutons pour les contrôles
    let leftButton = null;
    let leftRotButton = null;
    let rightButton = null;
    let rightRotButton = null;
    let downButton = null;

    /****************************************************
     * Réglages principaux                              *
     ****************************************************/

    // Contrôle du jeu
    let isGameOver = false;
    let tetroFallDelay = 1000;
    let isRotKeyDown = false;
    let fallCallback = null;

    // Taille du terrain de jeu
    let fieldCols = null;
    let fieldRows = null;

    // Données du terrain de jeu
    let pfData = [];

    // Largeur du block
    let blockWidth = 0;

    // Pièce en cours
    let currentTetro = null;
    let currentTetroRot = null;
    let currentTetroX = null;
    let currentTetroY = null;
    let nextTetro = null;

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
                if (pfData[x + y * fieldCols] === 0) {
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
                fallCallback = window.setInterval(tetroFall, tetroFallDelay);
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
        if (canPlaceTetro(currentTetroX, currentTetroY, currentTetroRot)) {
            placeTetro();
        }
        else {
            // Impossible de placer le nouveau tetro : donc fin de jeu
            placeTetro();
            window.clearInterval(fallCallback);
            isGameOver = true;
            nextTetroField.innerHTML = 'GAME OVER';
        }
    }

    /**
     * Dessine le tetromino suivant dans sa fenêtre dédiée
     */
    function updateNextTetro() {
        nextTetroField.innerHTML = '';
        let nextTetroSize;
        if (nextTetroField.clientHeight < nextTetroField.clientWidth) {
            nextTetroSize = nextTetroField.clientHeight * 0.75;
        }
        else {
            nextTetroSize = nextTetroField.clientWidth * 0.75;
        }
        let nextTetroBloc = nextTetroSize / 4;
        let nextTetroDivTop = nextTetroField.clientHeight / 2 - nextTetroBloc * 2;
        let nextTetroDivLeft = nextTetroField.clientWidth / 2 - nextTetroBloc * 2;
        // Rendu du tetro
        let nextTetroData = tetro[nextTetro - 1];
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (nextTetroData[x + y * 4] !== 0) {
                    // Création du bloc
                    let block = document.createElement('div');
                    block.style.position = 'absolute';
                    block.style.width = nextTetroBloc + 'px';
                    block.style.height = nextTetroBloc + 'px';
                    block.style.top = (nextTetroDivTop + nextTetroBloc * y) + 'px';
                    block.style.left = (nextTetroDivLeft + nextTetroBloc * x) + 'px';
                    block.classList.add('tetromino')

                    // Sélection de la pièce à afficher
                    block.classList.add('tetromino' + nextTetro);

                    // Dessin du bloc
                    nextTetroField.appendChild(block);
                }
            }
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
     * @returns {array} Un tableau contenant le tetromino tourné
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
     * @param {KeyboardEvent} keyEvent Si c'est une touche du clavier qui a été appuyé, permet de récupérer la touche appuyée
     * @param {boolean} isCallback Mise à true par le callback pour indiquer que la pièce tombe
     */
    function moveTetro(action, keyEvent = null, isCallback = false) {
        if (!isRotKeyDown && !isGameOver) {
            let nextTetroX = currentTetroX;
            let nextTetroY = currentTetroY;
            let nextTetroRot = currentTetroRot;

            let willStick = false;

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
                    if (!isCallback) {
                        // Si on fait descendre la pièce et que ce n'est pas le callback
                        scorePoints(10);
                        window.clearInterval(fallCallback);
                        fallCallback = window.setInterval(tetroFall, tetroFallDelay);
                    }
                    nextTetroY++;
                    break;
                case 'key':
                    // Gestion touches du clavier
                    switch (keyEvent.key) {
                        case 'Escape':
                            console.log('Escape');
                            if (fallCallback) {
                                window.clearInterval(fallCallback);
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
                            isRotKeyDown = true;
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
                            isRotKeyDown = true;
                            nextTetroRot++;
                            if (nextTetroRot > 3) {
                                nextTetroRot = 0;
                            }
                            break;
                        case 's':
                        case 'S':
                            // On rajoute 10 points par lignes quand on fait descendre volontairement la pièce
                            scorePoints(10);
                            window.clearInterval(fallCallback);
                            fallCallback = window.setInterval(tetroFall, tetroFallDelay);
                            nextTetroY++;
                            break;
                        default:
                            break;
                    }
                    break;
                default:
                    break;
            }
            
            // Peut on placer ce tetro à cet endroit ?
            // On met d'abord des 0 à l'emplacement de la pièce
            placeTetro(false);
            if (canPlaceTetro(nextTetroX, nextTetroY, nextTetroRot)) {
                currentTetroX = nextTetroX;
                currentTetroY = nextTetroY;
                currentTetroRot = nextTetroRot;
                placeTetro();
            }
            else {
                if (keyEvent) {
                    if ((keyEvent.key === 's') || (keyEvent.key === 'S')) {
                        willStick = true;
                    }
                }
                else {
                    if (action === 'down') {
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
     * Permet de vérifier si on peut placer le tetromino à cet endroit.
     * @param {int} xToCheck La position X du tetromino à vérifier
     * @param {int} yToCheck La position Y du tetromino à vérifier
     * @param {int} rotToCheck La rotation à appliquer au tetromino en cours de vérification
     * @returns {boolean} true si la pièce peut être placée, sinon false
     */
    function canPlaceTetro(xToCheck, yToCheck, rotToCheck) {
        let tetroArray = rotate(tetro[currentTetro - 1], rotToCheck);
        let canPlace = true;
        check:
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (tetroArray[x + y * 4] !== 0) {
                    if (pfData[xToCheck + x + (yToCheck + y) * fieldCols] !== 0) {
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
     * @param {boolean} show Toggle pour afficher ou cacher le tetromino
     */
    function placeTetro(show = true) {
        let tetroArray = rotate(tetro[currentTetro - 1], currentTetroRot);
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (tetroArray[x + y * 4] !== 0) {
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
        // Mets aussi à jour le nouveau tetro
        updateNextTetro();
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

        // Et on redessine
        renderPlayField();
    }

    /**
     * Initialise le terrain de jeu avec des murs extérieur et l'intérieur vide
     */
    function initPlayField() {
        for (let row = 0; row < fieldRows; row++) {
            for (let col = 0; col < fieldCols; col++) {
                if ((col === 0) || (col === (fieldCols - 1)) || (row === (fieldRows - 1))) {
                    // On met des tetromino noirs sur les bords et le bas du terrain de jeu
                    pfData.push(8);
                }
                else {
                    // On laisse l'espace vide pour le reste
                    pfData.push(0);
                }
            }
        }
    }

    /**
     * Permet de renseigner le div dans lequel le terrain de jeu sera affiché.
     * Mesure par défaut 10 colonnes par 24 lignes (+10 cachées au dessus).
     * DOIT être appelé.
     * @param {HTMLElement} playDiv Le div ou apparaitra le terrain de jeu
     * @param {HTMLElement} nextTetroDiv Le div où doit apparaître la prochaine pièce
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
        nextTetroField.parentElement.style.position = 'relative';

        initPlayField();
    }

    /**
     * Permet de renseigner les div qui contiendront le score et le niveau actuel
     * DOIT être appelé.
     * @param {HTMLElement} scoreDiv L'élément DOM contenant le score : son textContent sera remplacé
     * @param {HTMLElement} linesDiv L'élément où doit apparître le nombre de lignes réalisées
     * @param {HTMLElement} levelDiv L'élément DOM contenant le niveau en cours : son textContent sera remplacé
     */
    function setStatBoard(scoreDiv, linesDiv, levelDiv) {
        scoreField = scoreDiv;
        linesField = linesDiv;
        levelField = levelDiv;
    }

    /**
     * Permet de renseigner les boutons de commande
     * DOIT être appelé.
     * @param {HTMLElement} lBtn Le bouton Gauche
     * @param {HTMLElement} lrBtn Le bouton pour tourner la pièce vers la gauche
     * @param {HTMLElement} rBtn Le bouton Droit
     * @param {HTMLElement} rrBtn Le bouton pour tourner la pièce vers la droite
     * @param {HTMLElement} dBtn Le bouton Bas
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
        document.addEventListener('keyup', () => {
            isRotKeyDown = false;
        });
    }

    /**
     * Démarre le jeu
     */
    function start() {
        // Initialisation du jeu
        nextTetro = Math.floor(Math.random() * 7) + 1;
        // Dimensionnement initial du terrain de jeu
        resizePlayField();
        newTetro();
        placeTetro();
        
        // La fonction est également mise en callback de l'événement window.resize
        window.onresize = resizePlayField;

        // Envoi du timer de chute des pièces
        fallCallback = window.setInterval(tetroFall, tetroFallDelay);
    }

    return {
        setPlayField:   setPlayField,
        setStatBoard:   setStatBoard,
        setControls:    setControls,
        start:          start
    }
}
)();
