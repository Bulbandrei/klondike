export default class Card extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y, suit, number, frame, hidden, tableau)
	{
		super(scene, x, y);
		Phaser.GameObjects.Image.call(this, scene);


		this.setTexture('cardback');
		this.setScale(0.2);
		// Tableau starts as 0, that means the card is in stock
		this.setData({ suit: suit, number: number, frame: frame, hidden: hidden, tableau: tableau });
	}
}