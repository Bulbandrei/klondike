export default class Deck{
	constructor(cards){
		this.cards = cards;
	}
	getSuit(frameNumber){
		if (frameNumber < 13)
			return "clubs";
		if (frameNumber < 26)
			return "diamonds";
		if (frameNumber < 39)
			return "hearts";
		return "spades";	
	}

	getNumber(frameNumber){
		return (frameNumber+1) - ((frameNumber/13>>0) * 13);
	}
}