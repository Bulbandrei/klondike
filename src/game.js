import Deck from './deck.js';
import Card from './card.js';
//

var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 1024,
    height: 600,
    scene: {
        preload: preload,
        create: create
    }
};

var game = new Phaser.Game(config);
var scene;
var deck;
var stockGroup;
var wastePileGroup;
var tableauGroups = [];

function preload ()
{
    this.load.image('cardback', 'assets/back.png');
    this.load.spritesheet('cards', 'assets/classic_sheet.png', { frameWidth: 560, frameHeight: 780});
}

function create ()
{
    scene = this;

    initializeDeck();
    dealCards();
    createFoundations();
}

function initializeDeck() 
{
    let cards = [];
    let spritesheet = scene.textures.get('cards').getFrameNames();
    deck = new Deck(cards);
    for (var i = spritesheet.length - 1; i >= 0; i--) {
        let card = new Card(scene, 0,0, deck.getSuit(spritesheet[i]), deck.getNumber(parseInt(spritesheet[i])), spritesheet[i], true, 0);
        scene.children.add(card);
        deck.cards.push(card);
    };
}

function dealCards() 
{
    // Initialize
    let spritesheet = scene.textures.get('cards').getFrameNames();
    let tempDeck = deck;
    let x = 90;
    let y = 260;
    let pileSize = 1;
    let curPileSize = 0;
    let curGroup = scene.add.group();

    // Tableau
    for (var i = 0; i < 28; i++)
    {
        curPileSize++;
        var card = Phaser.Math.RND.pick(tempDeck.cards);
        if (curPileSize == pileSize){
            card.setTexture('cards');
            card.setFrame(card.data.values.frame);
            card.setInteractive({draggable: true});
            card.data.values.hidden = false;
        }
        scene.children.bringToTop(card);
        card.setPosition(x, y);
        card.data.values.tableau = pileSize;
        curGroup.add(card);

        y += 10;
        tempDeck.cards.splice(tempDeck.cards.indexOf(card), 1);
        if (curPileSize == pileSize){
            pileSize++;
            curPileSize = 0;
            x += 140;
            y = 260;
            tableauGroups.push(scene.add.group(curGroup.getChildren()));
            curGroup.clear();
        }
    }    

    // Stock
    x = 90;
    y = 90;
    stockGroup = scene.add.group();
    wastePileGroup = scene.add.group();
    for (var i = 0; i < 24; i++)
    {
        var card = Phaser.Math.RND.pick(tempDeck.cards);
        card.setPosition(x, y);
        tempDeck.cards.splice(tempDeck.cards.indexOf(card), 1);
        stockGroup.add(card);
    }

    // Stock input zone
    let stockZone = scene.add.zone(90, 90, 112, 156).setName('Stock').setInteractive().on('pointerdown', function(pointer, localX, localY, event){
        touchedStock();
    });
}

function createFoundations()
{
    var graphics = scene.add.graphics();
    for (var i = 0; i < 4; i++) {
        let zone = scene.add.zone(510 + i*140, 90, 112, 156).setRectangleDropZone(112, 156);
        zone.setData({ suit: "", cards: 0 });
        graphics.lineStyle(2, 0xffffff);
        graphics.strokeRect(zone.x - zone.input.hitArea.width / 2, zone.y - zone.input.hitArea.height / 2, zone.input.hitArea.width, zone.input.hitArea.height);   
    }

    // Foundations drag and drop
    scene.input.on('dragstart', function (pointer, card) {
        scene.children.bringToTop(card);
    }, scene);

    scene.input.on('drag', function (pointer, card, dragX, dragY) {
        card.x = dragX;
        card.y = dragY;
    });

    scene.input.on('dragenter', function (pointer, card, dropZone) {
        graphics.lineStyle(2, 0x00ffff);
        graphics.strokeRect(dropZone.x - dropZone.input.hitArea.width / 2, dropZone.y - dropZone.input.hitArea.height / 2, dropZone.input.hitArea.width, dropZone.input.hitArea.height);
    });

    scene.input.on('dragleave', function (pointer, card, dropZone) {
        graphics.lineStyle(2, 0xffffff);
        graphics.strokeRect(dropZone.x - dropZone.input.hitArea.width / 2, dropZone.y - dropZone.input.hitArea.height / 2, dropZone.input.hitArea.width, dropZone.input.hitArea.height);

    });

    scene.input.on('drop', function (pointer, card, dropZone) {
        let isDropValid = checkDropZone(card, dropZone);
        if (isDropValid){
            card.x = dropZone.x;
            card.y = dropZone.y;

            dropZone.data.values.cards++;
            dropZone.data.values.suit = card.data.values.suit; //TODO I should do this only once

            card.input.enabled = false;
            // Check if card came from tableau
            if (card.data.values.tableau > 0)
            {
                tableauGroups[card.data.values.tableau - 1].remove(card);
                turnNextTableauCard(card.data.values.tableau - 1);
            }
            else
            {
                //Card came from wastePile, gotta remove from that group
                wastePileGroup.remove(card);
            }
        }
        else
        {
            card.x = card.input.dragStartX;
            card.y = card.input.dragStartY;
        }
    });

    scene.input.on('dragend', function (pointer, card, dropped) {
        if (!dropped)
        {
            card.x = card.input.dragStartX;
            card.y = card.input.dragStartY;
        }
    });
}

function touchedStock()
{
    if (stockGroup.getChildren().length == 0 &&
        wastePileGroup.getChildren().length == 0)
        return;

    if (stockGroup.getChildren().length == 0)
    {
        // Done like this so the stock pile card list is in the same order as before
        for (var i = wastePileGroup.getChildren().length - 1; i >= 0; i--) {
            let card = wastePileGroup.getChildren()[i];
            card.setTexture('cardback');
            card.setPosition(90, 90);
            card.disableInteractive();
            stockGroup.add(card);
        }

        wastePileGroup.clear();
        return;
    }
    let card = stockGroup.getChildren()[stockGroup.getChildren().length-1];

    card.setTexture('cards');
    card.setFrame(card.data.values.frame);
    card.off('onInputDown', touchedStock); // removes pointerDown
    card.setInteractive({draggable: true});
    card.setPosition(230, 90);
    card.data.values.hidden = false;
    scene.children.bringToTop(card);

    wastePileGroup.add(card);
    stockGroup.remove(card);
}

function checkDropZone(card, dropZone)
{
    if ((dropZone.data.values.cards == 0 && card.data.values.number == 1) ||
        (dropZone.data.values.suit == card.data.values.suit &&
        dropZone.data.values.cards == card.data.values.number - 1))
    {
        return true;
    }
    return false;
}

function turnNextTableauCard(tableau)
{
    console.log(tableau);
    console.log(tableauGroups[tableau]);
    console.log(tableauGroups[tableau].getChildren().length);
    let childLength = tableauGroups[tableau].getChildren().length;
    if (childLength > 0)
    {
        let card = tableauGroups[tableau].getChildren()[childLength - 1];
        card.setTexture('cards');
        card.setFrame(card.data.values.frame);
        card.setInteractive({draggable: true});
        card.data.values.hidden = false;
    }
}