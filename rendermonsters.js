// LIBRARIES AND GLOBAL PROTOTYPES
// =============================================================
#include "~/Desktop/Card Templating/Javascript/JSON-js-master/json2.js";

// Replaces all instances str1 in parent string object with str2
String.prototype.replaceAll = function(str1, str2, ignore){
	return this.replace(new RegExp(str1.replace( /([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

// returns true if str1 is found in parent string object
String.prototype.includes = function(str1, ignore){
	if (this.search(str1) == -1) {
		return false;
	} else {
		return true;
	}
}
// =============================================================

// CONSTANTS
// =============================================================
const sourceData = "C:/Users/alex/AppData/Roaming/Adobe/InDesign/Version 11.0/en_US/Scripts/Scripts Panel/github/DnD-Monster-Stat-Cards/bestiary-mm.json";
const metaData = "~/Desktop/Card Templating/meta.json"
// =============================================================

// FUNCTIONS
// =============================================================
/* DESCRIPTION: Duplicates InDesign Spread
 * Creates enough pages in the inDesign document to hold all the monsters and
 * returns a list of monster statblock groups in the active InDesign document
 * list is an object taken from the sourceData JSON file
 */
var MonGroups = function ( list ) {
	this.groups = []; 																		// a list of monster stat-blocks in the InDesign document
	var mydoc = app.activeDocument;
	var docGroups = mydoc.groups;												// all groups in the InDesign document
	var newBlock;

	function init( groups ) {
		for ( var i = 2, len = list.length; i < len; i += 4 ) {								// loop until enough blocks are made
				app.layoutWindows[ 0 ].activeSpread.duplicate( LocationOptions.AFTER, app.layoutWindows[ 0 ].activeSpread ); // duplicate the spread
		}

		for ( var i  = 0, len = docGroups.length; i < len; ++i ) {							// loop over all groups in documents
			if( docGroups[ i ].name == "Monster" ) {
				newBlock = new Block( docGroups[ i ] );
				groups.push( newBlock );													// make a list of group with the name "Monster"
			}
		}
	}
	init( this.groups );
}

/*	A single group of text frames for a monster.*/
var Block = function( group ) {
	this.block = group;
}

/* DESCRIPTION: Finds a text frame
 * Searches layer names in Block container. Returns the first match only
 * Name is the name of the target layer
 * From Harbs at https://forums.adobe.com/message/3907814#3907814
 */
Block.prototype.getObject = function( name ) {
	var objects = this.block.allPageItems.slice();											// Put page items in conatiner into an array
	for( var i=0;i<objects.length;i++ ) {  													// Iterate over the array
		if( objects[ i ].name == name ) {													// compare page item names to target
			return objects[ i ];  															// return the first match found
		}
	}
	alert( name + " frame not found");  																// NULL if not found
	return null;
}

/* DESCRIPTION: Creates Monster list
 * Asks the user how to filter the data file and returns a list of monsters
 * path is a string representing the location of the sourceData file.
 */
var Bestiary = function ( stats, meta ) {

	this.mons = [];
	this.meta = loadData( meta );

	/* DESCRIPTION: Parse JSON file
	 * Takes a file path as a string and returns an object.
	 */
	function loadData( path ) {
		var myFile = File( path );															// Store the file in memory

		if ( myFile != false ){																// Check that file exists
			myFile.open('r');																// Open file on read mode
			var library = JSON.parse( myFile.read() ); 										// JSON data parsed into an object
			myFile.close();																	// Close the file
		  return library; 																	// Return the parsed object
		} else {
				throw "JSON file not found.";												// Throw an error if the file doesn't exist
		};
	}

	/* DESCRIPTION: Sample Dialog
	 * Based on javascript from http://jsid.blogspot.com/2007/08/scriptui-dialog-with-interacting.html
	 * Opens a dialog window with filter options. Returns an integer from 1 -> 3 reprenting the chosen option
	 */
	function getOptions() {

	  myDlg = new Window( 'dialog', 'Filters' );											// Create a dialog window
	  myDlg.orientation = 'row';															// Set elements in windows in a row

	  myDlg.nameBtn = myDlg.add( 'button', undefined, 'By Name' );							// Add buttons
	  myDlg.typeBtn = myDlg.add( 'button', undefined, 'Beasts' );							// ...
	  myDlg.legendBtn = myDlg.add( 'button', undefined, 'Legendaries' );							// ...
	  myDlg.allBtn = myDlg.add( 'button', undefined, 'All' ); 								// ...

	  myDlg.nameBtn.onClick = function() {													// Add button functions
		this.parent.close( 1 );
	  }
	  myDlg.typeBtn.onClick = function() {
		this.parent.close( 2 );
	  }
	  myDlg.legendBtn.onClick = function() {
		this.parent.close( 3 );
	  }
	  myDlg.allBtn.onClick = function() {
		this.parent.close( 4 );
	  }

	  return myDlg.show();
	}

	/* DESCRIPTION: Creates Monster list
	 * Calls on loadData and getOptions, returns an array of monster objects
	 */
	function list( mons, source) {
		var bestiary = loadData( source );													// Holds all monsters in the source file
		var monster;
		var result = getOptions();
		for ( var i = 0, len = bestiary.monster.length; i < len; ++i ){						// iterate through bestiary
			if ( result == 1 && bestiary.monster[ i ].name != "Strahd von Zarovich" ) {		// check name of each monster
				continue;																	// skip non-matching names
			} else if ( result == 2 && bestiary.monster[ i ].type != "beast" ) {				// check type of each monster
				continue;																	// skip non-matching types
			} else if (result == 3 && !( "legendary" in bestiary.monster[ i ] || "legendaryGroup" in bestiary.monster[ i ] ) ) {
				continue;
			} else if (result == 3 && ( "legendary" in bestiary.monster[ i ] || "legendaryGroup" in bestiary.monster[ i ] ) ) {
				monster = new Monster( bestiary.monster[ i ] );
				mons.push( monster );														// add the monster to the array
			} else if ( !( "legendary" in bestiary.monster[ i ] || "legendaryGroup" in bestiary.monster[ i ] ) ) {
				monster = new Monster( bestiary.monster[ i ] );
				mons.push( monster );														// add the monster to the array
			}
		}
	}

	list( this.mons, stats);
}

// MONSTER
// --------------------------------------------------------------
var Monster = function( stats ) {
	this.stats = stats;
	if ( "legendary" in this.stats || "legendaryGroup" in this.stats ) {
		this.legendary = true;
	} else {
		this.legendary = false;
	}
}

/* DESCRIPTION: Apply SourceData
 * Types the source data from filtered into the groups from monGroups
 */
var printBestiary = function () {

	// HELPER FUNCTIONS
	//=========================

	/* DESCRIPTION: Checks if an object is a dictionary with key/value pairs
	 * takes any object, and returns true or false
	 */
	function isDict( obj ) {
		if( !obj ) return false;
	    if( obj.constructor === Array ) return false;										// if the obj has an array constructor, then its an array
	    if( obj.constructor != Object ) return false;										// if the obj does not have the Object constructor, it's not a dict
	    return true;
	}

	// Checks if an object is a list
	function isList( obj ){
		if( obj.constructor === Array ) {
			return true;
		} else {
			return false;
		}
	}

	/* DESCRIPTION: Types given text into InDesign
	 * Types characters one at a time while looking for tags to edit.
	 * text is a string, frame is a text frame object in InDesign
	 */
	function renderEntry( text, frame ) {

		// CHILD FUNCTIONS
		// ========================
		/* 	DESCRIPTION: Type formatted tags into InDesign
		 	recognizes tags and prints the associated text
			*/
		function renderTag( tag, textFrame ) {

			/* DESCRIPTION: Split a tag
			 * Split a string with a tag into the tag name and content
			 * returns an array with the two halves of the string, eg. ["@atk", "mw,rw"]
			 */
			function splitFirstSpace( string ) {
				const firstIndex = string.indexOf( " " );
				return firstIndex === -1 ? [ string, "" ] : [ string.substr( 0, firstIndex ),
					string.substr( firstIndex + 1 ) ];
			}

			/* DESCRIPTION: parses the tag abbreviations in attacks and returns a string */
			function attackTagToFull (atkTag){
				var output = "";

				if (atkTag.includes("m")){
					output += "M. ";
					if (atkTag.includes("r")){
						output += "or R. ";
					}
				} else if (atkTag.includes("r")){
					output += "R. ";
				} else if (atkTag.includes("a")){
					output += "Area";
				}

				if (atkTag.includes("w")){
					output += "W ";
				} else if (atkTag.includes("s")){
					output += "Spell ";
				}

				output += "Atk: ";
				return output;
			}

			/* DESCRIPTION: selects a range of new text in the InDesign DOM,
			 * and applies a Character style
			 * textFrame is a frame object in InDesign, style is a string, string is the text
			 */
			function applyStyle( textFrame, style, string ){
				var ip1, addedText;

				ip1 = textFrame.parentStory.insertionPoints[ -1 ].index;						// remember last insertion point
				textFrame.parentStory.insertionPoints.item( -1 ).contents = string;				// add new text to frame at last insertion point
				addedText = textFrame.characters.itemByRange( textFrame.insertionPoints[ ip1 ], textFrame.insertionPoints [ -1 ] );											// select text from last insertion point to new one
				addedText.appliedCharacterStyle = style;										// change the character style
				textFrame.parentStory.insertionPoints[ -1 ].appliedCharacterStyle = "None";		// Change back to None for future text
			}

			const tagSplit = splitFirstSpace( tag );

			switch ( tagSplit[ 0 ] ) {

				case( "@atk" ):
					textFrame.parentStory.insertionPoints.item( -1 ).contents = attackTagToFull( tag );
					break;

				case( "@hit" ):
					applyStyle( textFrame, "bold", "+" + tagSplit[ 1 ] );
					break;
				case( "@damage"):
					applyStyle( textFrame, "bold", tagSplit [1 ] );
					break;
				case( "@recharge" ):
					if (tagSplit[1] == ""){
						return ( "(Recharge 6)" )
					} else {
						return ( "(Recharge " + tagSplit[ 1 ] + "). " )
					}
					break;
				case( "@spell" ):
					applyStyle( textFrame, "italic", tagSplit[ 1 ] );
					break;
				case("@chance"):
					applyStyle( textFrame, "italic", "\n" + tagSplit[ 1 ] + "%" );
					break;
				case("@i"):
					applyStyle( textFrame, "italic", "\r" + tagSplit[ 1 ] );
					break;
				case( "@item" ):
				case( "@creature" ):
				case( "@condition" ):
				case( "@skill" ):
				case( "@dice" ):
					applyStyle( textFrame, "None", tagSplit[ 1 ] );
					break;
				default:
					alert( "Unknown Tag: " + tagSplit[0] );
					applyStyle( textFrame, "None", tagSplit[ 0 ] + " UNKNOWN TAG" );
				}														// formats tags conditionally
		}

		// ========================
		// MAIN
		// ========================
		var char1, char2;																		// these two "pointers" step through a string and compare adjacent characters
		var currentTag = "";																	// stores a string copied from the input
		var inTag = false, subTag = false;														// remembers if the char pointers are in a tag or not

		for ( var i = 0, len = text.length; i < len; ++i ) {									// iterate through text
			char1 = text.charAt( i );															// looks at current character
			char2 = i < text.length - 1 ? text.charAt( i + 1 ) : null;							// char 2 is the next character unless we've reached the end of the text

			switch( char1 ) {																	// always check the value of char1
				case "{":
					if ( char2 == "@" ) {														// "{@" means we've started reading a string
						inTag = true;
						subTag = false;
						currentTag += char2;													// add char2 to the currentTag
					}
					break;
				case "}":																		// "}" is likely the end of a tag
					if ( inTag == true ) {														// double check that we were in a tag to begin with
						inTag = false;
						subTag = false;															// close all running tags
						renderTag( currentTag, frame );												// type the tag with formatting
						currentTag = "";														// clear the currentTag for next tag
					}
					break;
				case "|":
					if ( inTag == true ) {														// track when we are in a subTag
						subTag = true;
					}
					break;
				default:
					if ( subTag == false ) {
						if ( inTag == false ) {												// only type into the document when the cursor is not in a tag
							frame.parentStory.insertionPoints.item( -1 ).contents = char1;		// type char1 into next insertion point
						} else if ( char1 != "@" ) {											// don't put double "@" into the currentStr
							//alert(currentTag + " + " + char1 + "\r" + "subTag = " + subTag );
							currentTag += char1;												// add char one to the current tag
						}
					}
			}
		}
	}

	/* DESCRIPTION: Changes str to title case
	 * Iterates over each character in a sctring and changes the first character of each
	 * word into unpper case. All other ccahracters are changes to lower case
	 */
	function titleCase(str) {
		str = str.toLowerCase().split(' ');
		for (var i = 0; i < str.length; i++) {
			if(str[i] != "of"){
			str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
			}
		}
		return str.join(' ');
	}

	/* DESCRIPTION: Constructs a string from an object with key/value pairs
	 * dict is an object with key/value pairs,
	 * type is a one word string describing the content
	 * returns a string
	 */
	function printDict( dict, datatype ) {
		var output = "";

		if (datatype == "resist" || datatype == "immune") {
			if ("preNote" in dict) {
				output += dict.preNote + " ";
			}
			if ("resist" in dict) {
				output += printList(dict.resist, "other") + " ";
			} else if ("immune" in dict) {
				output += printList(dict.immune, "other") + " ";
			}
			if ("note" in dict) {
				output += dict.note;
			}
			if ("special" in dict) {
				output += dict.special;
			}
			return output;
		}

		for ( var key in dict ) {
			if (!dict.hasOwnProperty(key) || typeof(dict[key]) === "boolean") continue;		// skip values inherited from prototype and booleans

			if( key == "from" || key == "formula" || key == "tags" || 						// add a bracket before second properties of AC and HP
			  ( key == "ac" && dict.braces == true ) )
			  { output += " ("; }

  	  		if(isList(dict[ key ] ) ) {														// let printList handle properties that are lists
	  			output += printList( dict[ key ], "other" );

			} else if ( isDict( dict[ key ] ) ) {											// only speed has nested dictionaries
				output += ( " " + key + " " + printDict( dict[ key ], "speed" ) );

			} else if ( datatype == "speed" || datatype == "skill" || datatype == "save" ) {//speed, save, and skill all print the key names

				if( output.length != 0 && key != "condition" ) {
					output += ",";															// add a comma before each new item
				}

				if( key == "walk" || key == "condition" || key == "number" ){
					output += ( " " + dict[ key ] + " " );									// print the item
				} else {
					output += " " + ( titleCase( key ) + " " + dict[key] + " " );			// Print the name of the key first
				}
				if( datatype == "speed" && key != "condition" ) {
					output += "ft.";														// add "ft." after speed values
				}

			} else {
				output += dict[ key ];
			}
		}

		//if(datatype == "ac" || datatype == "type"){
		//	output = output.substring(0, output.length - 2);								// remove extra space and comma from end of output
		//}

		if (datatype == "ac" || datatype == "hp" || datatype == "type"){					// add a bracket at the end of AC and HP only
			output += ")";
		}

		return output;
	}

	/* DESCRIPTION: Construct a string from an Array
	 * Iterates through an array and puts each item in a string,
	 * with special formatting for specific datatypes
	 */
	function printList (list, datatype){

		var output = "";																	// holds output string

		if( datatype == "resist" || datatype == "immune" ) {								// ensures physical damage types are listed first
			list = list.reverse();
		}
		for ( var i = 0, len = list.length; i < len; i++ ){
			if( isDict( list[ i ] ) ) {														// let another function handle list items that are dictionaries
				if( datatype == "resist" || datatype == "immune" ) {
						output += printDict( list[ i ], datatype ) + "; ";
				} else if ( datatype == "entries" ) {
					output += printList( list[ i ].items, "entryItem" );					// recursively print nested lists? !!! it's a dict already though
				} else {
					output += ( printDict( list[ i ], datatype) + "" );						// add the contents of the dictionary to the list
				}
			} else if ( datatype == "list" ) {
				output += ( list[ i ] + "\r" );
			} else if ( datatype == "ac"  || datatype == "hp") {
				output += ( list[ i ] );
			}else {
				// add list item to output
				output += ( list[ i ] + ", " );												// add the list item to the list
			}
		}

		if(datatype == "conditionImmune" || datatype == "immune" ||
			datatype == "spells" || datatype == "entries" || datatype == "other" ||
			datatype == "resist") {
			return output.substring(0, output.length-2);									// remove extra space and comma
		}

		return output;																		// return the finished string
	}

	/* DESCRIPTION: Returns a string with size, type, and alignment values
	 * stats is the stats of a Monster object */
	function printSizeTypeAlign( stats ) {
		var sizeList = {"T": "Tiny", "S": "Small", "M": "Medium", "L": "Large",				// a dictionary of size abbreviations and their full names
						"H": "Huge", "G": "Gargantuan"}
		var alignList = {"C": "chaotic", "N": "neutral", "L": "lawful", "G": "good",		// a dictionary of alignment abbreviations and their full names
						"E": "evil", "U": "unaligned", "A": "any alignment"}
		return (sizeList[stats.size] + " " + ( isDict( stats.type ) ? printDict( stats.type, "type" ) : stats.type ) + ", " + ( stats.alignment[ 0 ] == "U" || stats.alignment[ 0 ] == "A" ? alignList[ stats.alignment[ 0 ] ] : alignList[ stats.alignment[ 0 ] ] + " " + alignList[ stats.alignment[ 1 ] ] ) );
	}

	/* DESCRIPTION: Converts CR to XP
	 * Takes a Cr value and returns a string
	 */
	function printXP( combatRating ) {
		var xpList = {"0": "10", "1/8": "25", "1/4": "50", "1/2": "100", "1": "200",
						"2": "450", "3": "700", "4": "1,100", "5": "1,800", "6": "2,300",
						 "7": "2,900", "8": "3,900", "9": "5,000", "10": "5,900",
						 "11": "7,200", "12": "8,400", "13": "10,000", "14": "11,500",
						 "15": "13,000", "16": "15,000", "17": "18,000", "18": "20,000",
						 "19": "22,000", "20": "25,000", "21": "33,000", "22": "41,000",
						 "23": "50,000", "24": "62,000", "25": "75,000", "26": "90,000",
						 "27": "105,000", "28": "120,000", "29": "135,000", "30": "155,000"}

		if ( isDict( combatRating ) ) {
			return ( xpList[ combatRating.cr ] + " XP" );
		}
		return ( xpList[ combatRating ] + " XP" );
	}

	/* DESCRIPTION: Converts Ability Scores to modifiers
	 * Takes an Ability Score from 0 to 30 and converts it to an ability modifier
	 */
	function getModifier ( attr ) {
		var modArray = [0, -5, -4, -4, -3, -3, -2, -2, -1, -1, 0, 0,1, 1,
						2, 2, 3, 3, 4, 4, 5, 5,6, 6, 7, 7, 8, 8, 9, 9, 10, 10];
		if ( attr > 11 ) {
			return ( "+" + modArray[ attr ] );
		} else {
			return modArray[ attr ];
		}
	}

	/* DESCRIPTION: Prints monster features
	 * takes a monster objects and searches it for specific keys.
	 * the key names and values are added to the output object and then
	 * rendered into the InDesign text frame objec
	 */
	function renderProps (mon, textFrame) {
		var output = "";
		// a list of possible property names in the json
		var props = ["save", "skill", "resist", "immune", "vulnerable",
					"conditionImmune"]

		// iterate over the props list and check if the mosnter has each
		// if so, fill in that property
		for(var i = 0, len = props.length; i < len; ++i){
			if(props[i] in mon){
				switch(props[i]){
					case("save"):
						output += "Saving Throws. " + printDict(mon.save, "save") + "\r";
						break;
					case("skill"):
						output += "Skills. " + printDict(mon.skill, "skill") + "\r";
						break;
					case("resist"):
						output += "Damage Resistances. " + printList(mon.resist, "resist") + "\r";
						break;
					case("immune"):
						output += "Damage Immunities. " + printList(mon.immune, "immune") + "\r";
						break;
					case("conditionImmune"):
						output += "Condition Immunities. " + printList(mon.conditionImmune, "conditionImmune") + "\r";
						break;
				}
			}
		}
		output += "Senses. " + ("senses" in mon ? mon.senses + " " : "") + "passive Perception " + mon.passive + "\r";
		output += "Languages. " + ("languages" in mon ? mon.languages : "—");

		// put output into text frame and apply properties paragraph style
		var paraStyle = app.documents[0].paragraphStyles.item("Properties");
		//output = output.replaceAll("undefined", "");
		textFrame.contents = output.replaceAll(",", ", ");
		textFrame.parentStory.texts.item(0).applyParagraphStyle(paraStyle, true);
		textFrame.contents += " ";
	}

	/* DESCRIPTION: Prints monster traits
	 * Iterates over a monster's traits and renders them using renderEntry
	 */
	function printTraits( traits, textFrame ){
		var ip1, addedText;
		ip1 = textFrame.parentStory.insertionPoints[-1].index;
		for (var i = 0, len = traits.length; i < len; i++){
			renderEntry(traits[i].name + ". " + printList(traits[i].entries, "entries") + "\r", textFrame);
		}
		addedText = textFrame.characters.itemByRange(textFrame.insertionPoints[ip1], textFrame.insertionPoints[-1]);
		addedText.appliedParagraphStyle = "traits";
	}

	// spells is a JSON object, section can be "Innate" or "Class"
	function printSpells( spells, textFrame ){
		var keyList = [ "name", "headerEntries", "will", "daily", "spells", "ability" ];
		var spellLvl = [ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "1e", "2e", "3e" ]
		var LvlFull = { "0": "Cantrips", "1": spells.name.includes( "Innate" ) ? "1/day" : "1st", "2": spells.name.includes("Innate") ? "2/day" : "2nd", "3": spells.name.includes("Innate") ? "3/day" : "3rd", "4":"4th", "5": "5th", "6": "6th", "7": "7th", "8": "8th", "9": "9th", "1e": "1/day each", "2e": "2/day each", "3e": "3/day each"};
		var ip1, addedText;

		for( var i = 0, len = keyList.length; i < len; ++i ){
			if( keyList[ i ] in spells ) {
				switch( keyList[ i ] ) {
					case( "name" ):
						// print name of headerEntries/
						// 1 - get insertion point
						ip1 = textFrame.parentStory.insertionPoints[ -1 ].index;
						// 2 - write name + ". "
						textFrame.parentStory.insertionPoints.item( -1 ).contents = spells.name + ". ";
						break;

					case( "headerEntries" ):
						//print header description
						// 1 - write entry
						renderEntry(spells.headerEntries[ 0 ], textFrame );
						// 2 - get insertion point
						addedText = textFrame.characters.itemByRange( textFrame.insertionPoints[ ip1 ], textFrame.insertionPoints[ -1 ] );
						// 3 - format selection with traits praragrph style
						addedText.appliedParagraphStyle = "traits";
						// 4 - carraige return
						textFrame.parentStory.insertionPoints.item( -1 ).contents = "\r";
						// 5 - get insertion point (to select spells paragraph)
						ip1 = textFrame.parentStory.insertionPoints[ -1 ].index;
						break;

					case( "will" ):
						// 1 - print list
						renderEntry( "At Will: " + printList( spells.will, "spells" ) + "\r", textFrame );
						break;
					case( "daily" ):
						for( var j = 0, lon = spellLvl.length; j < lon; ++j ) {
							if( spellLvl[ j ] in spells.daily ) {
								renderEntry(LvlFull[ spellLvl[ j ] ] + ": " + printList( spells.daily[ spellLvl[ j ] ], "spells" ) + "\r", textFrame );
							}
						}
						break;
					case( "spells" ):
						for( var j = 0, lon = spellLvl.length; j < lon; ++j ) {
							if( spellLvl[ j ] in spells.spells ) {
								renderEntry( LvlFull[spellLvl[j]] + (spellLvl[j] == 0 ? ": " : " level (" + spells.spells[spellLvl[j]].slots + " slots): ") + printList(spells.spells[spellLvl[j]].spells, "spells") + "\r", textFrame);
							}
						}
				}
			}

		addedText = textFrame.characters.itemByRange(textFrame.insertionPoints[ip1], textFrame.insertionPoints[-1]);
		if (i != keyList.length - 1)
		addedText.appliedParagraphStyle = "spells";
		}
	}

	// Prints action headers
	function printTitle(title, textFrame){
		var ip1, addedText;
		ip1 = textFrame.parentStory.insertionPoints[-1].index;
		textFrame.parentStory.insertionPoints.item(-1).contents = title;
		addedText = textFrame.characters.itemByRange(textFrame.insertionPoints[ip1], textFrame.insertionPoints[-1]);
		addedText.appliedParagraphStyle = "action title";
		textFrame.parentStory.insertionPoints[-1].contents += "\r";
	}

	function printLairActions(actions, textFrame){
		var ip1, addedText;
		ip1 = textFrame.parentStory.insertionPoints[-1].index;
		for (var i = 0, len = actions.length; i < len; i++){
			if (isDict(actions[i])) {
				addedText = textFrame.characters.itemByRange(textFrame.insertionPoints[ip1], textFrame.insertionPoints[-1]);
				addedText.appliedParagraphStyle = "None";
				ip1 = textFrame.parentStory.insertionPoints[-1].index
				renderEntry( printList(actions[i].items, "list"), textFrame);;
			} else {
				renderEntry( actions[i] + "\r", textFrame);
			}
		}
		addedText = textFrame.characters.itemByRange(textFrame.insertionPoints[ip1], textFrame.insertionPoints[-1]);
		addedText.appliedParagraphStyle = "Lair Actions List";
	}

	var bestiary = new Bestiary( sourceData, metaData );												// import data
	var blocks = new MonGroups( bestiary.mons );											// prepare InDesign document
	var mon;																				// shorthand for bestiary.mons[ i ]

	for ( var i = 0, len = bestiary.mons.length; i < len; ++i ) {
		mon = bestiary.mons[ i ], currentBlock = blocks.groups[ i ];					// just to improve readability

		// Header
		renderEntry( mon.stats.name, currentBlock.getObject( "name" ) );
		renderEntry( "CR " + (isDict(mon.stats.cr) ? mon.stats.cr.cr : mon.stats.cr), currentBlock.getObject( "CR" ) );
		renderEntry( printSizeTypeAlign(mon.stats), currentBlock.getObject( "STA" ) );		//size, type, and alignment
		renderEntry( printXP( mon.stats.cr ), currentBlock.getObject( "XP" ) );

		// Combat Stats
		renderEntry( printList(mon.stats.ac, "ac"), currentBlock.getObject( "acVal" ) );
		currentBlock.getObject( "hpVal" ).contents = printDict(mon.stats.hp, "hp");
		currentBlock.getObject( "speedVal" ).contents = printDict(mon.stats.speed, "speed");

		// Abilities
		currentBlock.getObject( "strVal" ).contents =
			( "" + mon.stats.str + " (" + getModifier( mon.stats.str ) + ")" );
		currentBlock.getObject( "dexVal" ).contents =
			( "" + mon.stats.dex + " (" + getModifier( mon.stats.dex ) + ")" );
		currentBlock.getObject( "conVal" ).contents =
			( "" + mon.stats.con + " (" + getModifier( mon.stats.con ) + ")" );
		currentBlock.getObject( "intVal" ).contents =
			( "" + mon.stats.int + " (" + getModifier( mon.stats.int ) + ")" );
		currentBlock.getObject( "wisVal" ).contents =
			( "" + mon.stats.wis + " (" + getModifier( mon.stats.wis ) + ")" );
		currentBlock.getObject( "chaVal" ).contents =
			( "" + mon.stats.cha + " (" + getModifier( mon.stats.cha ) + ")" );

		renderProps( mon.stats, currentBlock.getObject( "properties"  ) );				// properties

		var tempFrame = app.activeDocument.textFrames.add();								// Traits
		tempFrame.textFramePreferences.autoSizingType = AutoSizingTypeEnum.HEIGHT_ONLY;
		tempFrame.geometricBounds = [0, 0, 1000, 1000];

																							// spellcasting gets divided in two.
		if( "spellcasting" in mon.stats ) { 												// Innate
			for ( var key in mon.stats.spellcasting ) {
				if ( !mon.stats.spellcasting.hasOwnProperty( key ) ) continue; 				// skip values inherited from prototype
				if ( mon.stats.spellcasting[ key ].name.includes( "Innate" ) ) {
					printSpells( mon.stats.spellcasting[ key ], tempFrame);
					tempFrame.paragraphs[ -1 ].appliedParagraphStyle = "lastSpells";		// change style of last spell paragraph
				}
			}
		}

		if ( "trait" in mon.stats ) {
			printTraits( mon.stats.trait, tempFrame );
		}

		if( "spellcasting" in mon.stats ) { 												// Class Spells
			for ( var key in mon.stats.spellcasting ) {
				if ( !mon.stats.spellcasting.hasOwnProperty( key ) ) continue; 				// skip values inherited from prototype
				if ( mon.stats.spellcasting[ key ].name == "Spellcasting" ) {
					printSpells( mon.stats.spellcasting[ key ], tempFrame );
				}
			}
		}

		if ( "action" in mon.stats ){
			printTitle( "Actions", tempFrame );
			printTraits( mon.stats.action, tempFrame );
		}

		if( "legendary" in mon.stats ) {
			printTitle( "Legendary Actions", tempFrame );
			printTraits( mon.stats.legendary, tempFrame );
		}

		if ( mon.legendary ) {
			for ( each in bestiary.meta.legendaryGroup ){			// iterate through bestiary
				//alert(JSON.stringify(bestiary.fluff[j].stats.name));
				if ( bestiary.meta.legendaryGroup[ each ].name == mon.stats.legendaryGroup ) {	// check name of each monster
						if( "lairActions" in  bestiary.meta.legendaryGroup[ each ]) {
							printTitle( "Lair Actions", tempFrame );
							printLairActions( bestiary.meta.legendaryGroup[ each ].lairActions, tempFrame);
						}
				}
			}
		}
		// Move the traits and actions from the temp frame to the real one
		var myFrame = currentBlock.getObject( "body" );
		tempFrame.paragraphs.everyItem().move( LocationOptions.after, myFrame.insertionPoints[ -1 ] );
		tempFrame.remove()
	}
}

// =============================================================

printBestiary();
