/*
  DICTIONARY CODE
  Handles conlang dictionary entries and queries.
  I am also throwing the SVG parsing code in here temporarily. Later down the line I will refactor again but I don't want to right now
  Raw entries are formatted key|englishKey|types|definitions|etymology
*/
class Dictionary {
  conlangEntries;
  englishEntries;
  rawEntries;
  className;
  invisible;
  topThin;
  thin;
  topSlant;
  bottomThin;
  bottomSlant;
  backBottomThin;
  backBottomSlant;
  short;
  wide;
  double;
  colors;
  svgWidth;
  svgHeight;

  constructor(className) {
    this.conlangEntries = new Map();
    this.englishEntries = new Map();
	  this.colors = new Map([
		["#n", "#bac2de"],
		["#h", "#a6d189"] 
	]);
    this.className = className;
    this.svgWidth = 0;
    this.svgHeight = 0;
  }

  buildEntryMaps() {
    for (let i = 0; i < this.rawEntries.length; i++) {
      let rawEntry = this.rawEntries[i].split("|");
      let key = rawEntry[0];
      this.conlangEntries.set(key, this.rawEntries[i]);
      this.englishKeys = rawEntry[1].split(",");

      // Set English keys
      for (let x = 0; x < this.englishKeys.length; x++) {
        key = this.englishKeys[x];
        this.englishEntries.set(key, this.rawEntries[i]);
      }
    }
  }

  // https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
  toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
  }

  //Helper function to build the entry being displayed
  buildEntry(rawEntry) {
    let elements = rawEntry.split("|");
    let key = elements[0];
    let name = this.toTitleCase(key);
    let translation = this.toTitleCase(elements[1].replaceAll(',', ", "));
    let types = elements[2].split(",");
    let definitions = elements[3].split(",");
    let etymology = elements[4];
    let entry = `<div>${name} | ${translation}<ol>`;

    // Format definitions
    for (let i = 0; i < types.length; i++) {
      entry += `<li><i>${types[i]}</i> ${definitions[i]}</li>`;
    }

    // Add etymology
    entry += `</ol>${etymology}<br>`;
    // Add audio
    entry += `<audio controls><source src="../../../resources/${this.className}/sounds/${key}.ogg" type="audio/ogg">`;
    entry += `<source src="../../../resources/${this.className}/sounds/${key}.mp3" type="audio/mp3">`;
    entry += `Your browser does not support the audio tag.</audio></div>`;
    // Add image
    entry += this.draw(key);
    // Add separator
    entry += "<hr class='headerSeperator'/>";

    return entry;
  }

  // Iterate through all map values and return every entry as one big list
  // Not sure if this is the best approach? This is O(n)
  listAllEntries() {
    const iterator = this.conlangEntries.values();
    let list = "";

    for (let i = 0; i < this.conlangEntries.size; i++) {
      list += this.buildEntry(iterator.next().value);
    }

    return list;
  }

  // Update the div based on the input
  updateResult(query = "") {
    query = query.toLowerCase();
    let entryExists =
      this.conlangEntries.has(query) || this.englishEntries.has(query);

    if (entryExists) {
      let rawEntry = this.conlangEntries.has(query)
        ? this.conlangEntries.get(query)
        : this.englishEntries.get(query);
      document.getElementById("entry").innerHTML = this.buildEntry(rawEntry);
    } else if (query === "") {
      document.getElementById("entry").innerHTML = this.listAllEntries();
    } else {
      document.getElementById("entry").innerHTML =
        "<div><p>Entry not found.</p></div>";
    }
  }

  // Parse the full phrase and tokenize each relevant character into an array, and return that array
  // Parse the full phrase and tokenize each relevant character into an array, and return that array
  tokenize(phrase){
    const tokens = new Array();
    //Seperate numbers and letters
    const phrases = phrase.split(' ').map(n => ({
        lineNumber: n.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)/g)?.[0] ?? '0',
        line: n.replace(/[-+]?(?:\d*\.\d+|\d+\.?\d*)/g, "")
    }));
    const highestLine = Math.max(...phrases.map(n => n.lineNumber));
    const lowestLine = Math.min(...phrases.map(p => p.lineNumber));
    this.svgHeight = ((highestLine - lowestLine) + 1) * 125;
    const longestLineLength = Math.max(...phrases.map(n => n.line.length))
    let shortStacked = false;

    for (phrase of phrases){
      const line = phrase.line;
      const lineNumber = phrase.lineNumber;
      let currentX = 0;
      let currentY = (highestLine - lineNumber) * 125;
      let nextY = 0;
      let prevCompressed = false;
	    let stackedTopSlant = false;
      let currentColor = this.colors.get("#n");  
      
      for (let i = 0; i < line.length; i++){
        //Capture glyphs
        let previousGlyph = line[i-1];
        let currentGlyph = line[i];
         let nextGlyph = (line[i+1] === "#") ? line[i+3] : line[i+1];
        let nextNextGlyph = line[i+2];
        let advance = 75;
        const wasStackedTopSlant = stackedTopSlant;
        stackedTopSlant = false;

        //Check if this glyph is a color reference
        if (currentGlyph === "#"){
          const color = currentGlyph + nextGlyph;
          currentColor = this.colors.get(color) ?? this.colors.get("#n");
          i++;
          
          continue;
        }
        
        //Check for doubles
        const tempDouble = currentGlyph + (nextGlyph ?? "");
        const tempNextDouble = nextGlyph + (nextNextGlyph ?? "");
        const isDouble = this.double.includes(tempDouble);
        const isNextDouble = this.double.includes(tempNextDouble)
        
        if (isDouble){
          currentGlyph = tempDouble;
          i++;
          nextGlyph = line[i+1];
        }
        if (isNextDouble){
          nextGlyph = tempNextDouble;
          nextNextGlyph = line[i+2];
        }

        //Flags
        const isThin = this.thin.includes(currentGlyph);
        const isTopThin = this.topThin.includes(currentGlyph);
        const isShort = this.short.includes(currentGlyph);
        const isTopSlant = this.topSlant.includes(currentGlyph);
        const isBottomSlant = this.bottomSlant.includes(currentGlyph);
        const isNextBackBottomThin = this.backBottomThin.includes(nextGlyph);
        const isNextBackBottomSlant = this.backBottomSlant.includes(nextGlyph);
        const isInvisible = this.invisible.includes(currentGlyph);
        const isBottomThin = this.bottomThin.includes(currentGlyph);
        const isNextBottomThin = this.bottomThin.includes(nextGlyph);
        const isNextShort = this.short.includes(nextGlyph);
        const isAbovePrimaryLine = lineNumber > 0;
        const isBelowPrimaryLine = lineNumber < 0;

        let compressed = false;
        let glyphY = currentY + nextY;
        nextY = 0;
          
        /*
          This glyph is completely thin, 
          so advance 25 px
        */
        if (isThin){
          advance = 25;
        }
        /*
          This glyph's top half is thin, and the next glyph is short or its bottom half is thin, 
          so advance 25 px and flag that a short glyph is already compressed
        */
        if (isTopThin && (isNextBottomThin || isNextShort)){
          advance = 25;
          compressed = true;
        }
        /*
          This glyph's bottom half is thin, and the next glyph is short,
          so advance 25 px and flag that a short glyph is already compressed
        */
        if (isBottomThin && isNextShort){
          nextY += 50;
          advance = 25;
          compressed = true;
        }
        /*
          This glyph is short, and the next glyph is short,
          this glyph isn't already compressed, isn't on the primary line, and isn't 'zh',
          advance none and shift the next glyph's Y by 75 px,
          and flag that a short glyph is already compressed
        */
        if (!prevCompressed && isShort && isNextShort && !isAbovePrimaryLine && currentGlyph !== 'zh' && nextGlyph !== 'zh'){
          nextY += 75;
          advance = 0;
          compressed = true;
		      shortStacked = true;
          stackedTopSlant = isTopSlant;
        }
        /*
          This glyph is short, isn't already compressed, is above the primary line, and the next glyph isn't short,
          shift this glyph's Y by 50 px
        */
        if (!prevCompressed && isShort && isAbovePrimaryLine){
          glyphY += 50;
        }
        /*
          This glyph is below the primary line, and the primary line has stacked short glyphs,
          so shift this glyph's Y by 25 px
        */
        if (isBelowPrimaryLine && shortStacked){
          glyphY += 25;
        }
        /*
          This glyph's bottom half slants forward down or is short, above the primary line, and slants at the top,
		      and the next glyph's back bottom half slants forward down,
          so advance 25 px
        */
        if ((isBottomSlant || (isShort && isAbovePrimaryLine && isTopSlant)) && isNextBackBottomSlant){
          advance = 25;
        }
        /*
          This glyph's top half slants forward down or is thin, and the next glyph's back bottom half is thin,
          so advance 25 px
        */
        if ((isTopSlant || wasStackedTopSlant || isTopThin) && isNextBackBottomThin){
          advance = 25;
        }
        /*
          This glyph is visible, so push it to the tokens array
        */
        if (!isInvisible){
            tokens.push({
                name: currentGlyph,
                x: currentX,
                y: glyphY,
                color: currentColor
            });
        }
              
        prevCompressed = compressed;
        //Advance X
        currentX += advance;
        
        if (line.length === longestLineLength){
            this.svgWidth = Math.max(this.svgWidth, currentX);
        }
        
        //Debug
        // console.log(`
        // PREV CURR NEXT
        // ${previousGlyph}\t\t${currentGlyph}\t${nextGlyph}
        
        // RULES
        // isThin: ${isThin}
        // isTopThin: ${isTopThin}
        // isShort: ${isShort}
        // isTopSlant: ${isTopSlant}
        // isBottomSlant: ${isBottomSlant}
        // isNextBackBottomThin: ${isNextBackBottomThin}
        // isNextBackBottomSlant: ${isNextBackBottomSlant}
        // isInvisible: ${isInvisible}
        // isBottomThin: ${isBottomThin}
        // isNextBottomThin: ${isNextBottomThin}
        // isNextShort: ${isNextShort}
        // `);
          }
        }
    
    return tokens;
  }

  //Generate and append the svg code for the phrase provided
  draw(phrase){
    this.svgWidth = 0;
    this.svgHeight = 0;
    const tokens = this.tokenize(phrase);
    const sizeFactor = .7;
    let output = `<svg width="${this.svgWidth}" height="${this.svgHeight}"
    viewBox="-12.5 -12.5 ${this.svgWidth} ${this.svgHeight}"><g stroke-width="10" stroke-linecap="square" fill="none" transform="scale(${sizeFactor})">`;

    for (const token of tokens){
        output += `<use href="#${token.name}" transform="translate(${token.x}, ${token.y})" stroke="${token.color}"/>`;
    }

    output += "</g></svg>";

    return output;
  }

  checkQuestion(id, correctAnswer){
    const entry = document.getElementById(`entry${id}`).value.toLowerCase();
    const status = document.getElementById(`status${id}`)
    const answers = correctAnswer.split('|');
    
    for (let i = 0; i < answers.length; i++){
      if (entry === answers[i]){
        status.innerHTML = `<p id="status${id}">Correct!</p>`
        break;
      }
      else {
        status.innerHTML = `<p id="status${id}">Incorrect!</p>`
      }
    }
  }
}

class IctukV5 extends Dictionary {
  rawEntries = [
    "o|no,not,zero|Adv.,Adj.,Adj.,Intj.,N.|used as a function word to make negative a group of words or a word,not any,having no magnitude or quantity,not so,an act or instance of refusing or denying by the use of the word no|",
    "kofa|be|V.,V.|to have identity with: to constitute the same idea or object as,to have a specified qualification or characterization|",
    "u|only,single,just,one|Adj.,Adj.,Adv.,Adv.,Adv.|alone in a class or category,consisting of or having only one part/feature/portion,exactly,simply,barely|",
    "fash|good,yes,right|Adj.,Adv.,Adj.|of a high or desired quality,used as a function word to express assent or agreement,conforming to facts or truth|",
    "apa|unit|N.|a determinate quantity adopted as a standard of measurement|",
    "mbupa|week|N.|any six consecutive days|",
    "fotap|fight|V.,V.,N.,N.|to contend in battle or physical combat,to struggle to endure or surmount,a hostile encounter,a verbal disagreement|",
    "fotash|hello|N.|an expression or gesture of greeting|",
    "fotazhupa|goodbye|N.|a concluding remark or gesture at parting|",
    "akozh|fear,scare,scary|N.,V.,V.,Adj.|an unpleasant often strong emotion caused by anticipation or awareness of danger,to be filled with concern or regret over an unwanted situation,to frighten especially suddenly,causing fright|",
    "but|you|Pn.|the one being addressed|",
    "buzh|you all,y'all,you|Pn.,Pn.|plural form of you,the ones being addressed|",
    "fazhk|future,forward|Adj.,N.,Adj.,Adv.|existing or occurring at a later time,time that is to come,near/being at/belonging to the forepart,to or toward what is ahead or in front|",
    "fazho|over|Adv.,Adv.,Prep.|from one person or side to another,beyond some quantity/limit/norm often by a specified amount or to a specified degree,used as a function word to indicate position on or motion to the other side or beyond|",
    "fushkazhk|top|Adj.|of, relating to, or being at the top|",
    "fazhouk|go|V.,V.,V.|to move or travel in a particular way or direction or for a particular distance, to take a certain course or follow a certain procedure, to begin an action or motion|",
    "nguho|think,thought,idea|V.,V.,N.,N.|to form or have in the mind,to have as an opinion,something formed in the mind,a formulated thought or opinion|",
    "nguhoq|know,knowledge|V.,N.|to have understanding of,information/understanding/skill that you get from experience or education|",
    "ouktuk|ictuk|N.|the primary language of the Ictuza|",
    "ouktuzha|ictuza|Adj.,N.|of/relating to/or characteristic of ictuza|one or more bipedal Synoeca vespids|",
    "pung|let|V.|to give opportunity to or fail to prevent|",
    "tuf|i|Pn.|the one who is speaking or writing|",
    "tuzh|we|Pn.|I and the rest of a group that includes me|",
    "uk|hook,of,pin|N.,N.,V.,Prep.|a curved or bent device for catching/holding/pulling,something intended to attract and ensnare,to get the attention of someone,used as a function word to indicate origin or derivation|",
    "ukosh|death,die,dead,low,less|N.,V.,Adj.,Adj.,Adj.,Adj.,Adj.,Adj.|a permanent cessation of all vital functions,to pass from physical life,deprived of life; no longer alive,inanimate,situated or passing below the normal level/surface/base of measurement/the mean elevation,small in number or amount,of lesser degree/size/amount than average or ordinary,constituting a more limited number or amount|",
    "zhoub|job,do|N.,Adj.,V.|a specific duty/role/function,of or relating to a job or to employment,perform/execute|",
    "kou|at|Prep.|used as a function word to indicate presence or occurrence in/on/near|",
    "osh|it (1),thing|Pn.,N.|that one; used as subject or direct object or indirect object of a verb or object of a preposition usually in reference to a lifeless thing,an object or entity not precisely designated or capable of being designated|",
    "fazh|occurence,time,because (1)|N.,N.,Cjn.|the action or fact of happening or occurring,the measured or measurable period during which an action/process/condition exists or continues,the fact that|",
    "ofazh|past|Adj.,Prep.|just gone or elapsed,at the farther side of|",
    "ta|also|Adv.|in addition|",
    "ngu|question,ask|N.,V.|an interrogative expression often used to test knowledge,to call on for an answer|",
    "nguposh|who|Pn.|what or which person or persons|",
    "uknguposh|whose|Pn.|that which belongs to whom|",
    "nguosh|what|Pn.|used as an interrogative expressing inquiry about the identity/nature/value of an object or matter|",
    "ngufazh|when|Adv.,Cjn.|at what time,at or during the time that|",
    "ngupapsho|where|Adv.|at/in/or to what situation/position/direction/circumstances/respect|",
    "nguu|why|Adv.,Cjn.|for what cause/reason/purpose,the cause/reason/purpose for which|",
    "ngufazho|how|Adv.,Cjn.|in what manner or way,the way or manner in which|",
    "posh|they (1)|Pn.|that person|",
    "poshozh|they (2)|Pn.|that other person|",
    "oshozh|it (2)|Pn.|that other animal/thing|",
    "pozh|they (3)|Pn.|those people|",
    "ozh|they (4)|Pn.|those animals/things|",
    "pozhozh|they (5)|Pn.|those other people|",
    "ozhozh|they (6)|Pn.|those other animals/things|",
    "oup|on|Prep.,Prep.|used as a function word to indicate position in contact with and suppted by the top surface of,used as a function word to indicate position in contact with an outer surface|",
    "ooup|off|Prep.|used as a function word to indicate physical separation or distance from a position of rest",
    "fazha|with|Prep.|in respect to|",
    "oupu|in|Prep.|used as a function word to indicate inclusion/location/position within limits|",
    "opu|out|Prep.,Adv.|used as a function word to indicate an outward movement,in a direction away from the inside or center|",
    "fazhkoupu|through|Prep.|used as a function wd to indicate movement into something at one side  point and out at another and especially the opposite side of|",
    "fazhku|to,toward|Prep.,Prep.|used as a function word to suggest actual or figurative movement toward a place/person/thing to be reached,in the direction of|",
    "fazhkou|about|Prep.|with regard to|",
    "akozho|need|N.,V.,V.|a lack of something requisite/desirable/useful,to be necessary,to require|",
    "hapo|have|V.|to hold  maintain (something tangible/intangible) as a possession/privilege/entitlement/responsibility|",
    "fazhapo|get|V.|to gain possession of|",
    "fazhapouk|bring|V.|to convey/lead/carry/cause to come along with one toward the place from which the action is being regarded|",
    "sho|this (1)|Pn.|the person/thing that is present near in place/time/thought that has just been mentioned|",
    "sha|that (1)|Pn.|the person/thing indicated/mentioned/understood from the situation|",
    "shou|this (2)|Pn.|the idea/concept that is present  near in place/time/thought that has just been mentioned|",
    "shozh|these|Pn.|the people/things that are present near in place/time/thought that have just been mentioned|",
    "shazh|those (1)|Pn.|the people/things indicated/mentioned/understood from the situation|",
    "shouzh|those (2)|Pn.|the ideas/concepts indicated/mentioned/understood from the situation|",
    "foupuzh|every|Adj.|being each individual or part of a group without exception|",
    "foupuzhosh|everything|Pn.|all that relates to the subject|",
    "foupuzhpozh|everyone|Pn.|every person|",
    "aa|and|Cjn.|used as a function word to indicate connection or addition especially of items within the same class or type|",
    "ushkofazhapa|year|N.|a cycle in the Ictuza calendar of 108 days|",
    "akozhkofazhapa|enemy month|N.|the 15 day period based on Cetus\'s moon \"Fo\"|",
    "fotapkofazhapa|battle month|N.|the 57 day period based on Cetus\'s moons \"Fo\" and \"Shako\"|",
    "fashkofazhapa|victory month|N.|the 36 day celebratory period based on Cetus\'s moon \"Shako\"|",
    "kofazhapa|month,month unit|N.|an arbitrary unit to represent the concept of a month|",
    "mbufazhapa|week|N.|any six consecutive days|",
    "fazhapa|day|N.,N.|the time of light between one night and the next,about 32 hours|",
    "afazhapa|hour|N.,N.|the 32nd part of a day,32 minutes|",
    "aafazhapa|minute|N.,N.|the 32nd part of an hour,32 seconds|",
    "aofazhapa|second|N.,N.|the 32nd part of a minute,1/32768th of a day|",
    "oakozhosh|brave,strong|Adj.,Adj.,Adj.|having or showing mental or moral strength to face danger/fear/difficulty,having or marked by great physical power,having moral/emotional/intellectual power or ability|",
    "oakozhposh|soldier|N.|one engaged in military service|",
    "ukozhku|stupid|Adj.,Adj.|given to unintelligent decisions or acts,acting in an unintelligent or careless manner|",
    "akozhoq|require,owe|V.,V.|to demand as necessary or essential,to be under obligation to render something|",
    "papsho|body|N.,N.|the main/central/principal part,the organized physical substance of an animal or plant either living or dead|",
    "papshongu|brain,mind|N.,N.|the organ inside the head that controls all body functions of a vertebrate,the element or complex of elements in an individual that feels/perceives/thinks/wills/reasons|",
    "fazhpangu|eye|N.|a specialized light-sensitive sensory structure of animals that in nearly all vertebrates/most arthropods/some mollusks is the image-forming organ of sight",
    "zhang|see|V.|to perceive by the eye|",
    "papshopaa|heart,love|N.,N.,N.,V.|a hollow muscular organ of vertebrate animals that by its rhythmic contraction acts as a force pump maintaining the circulation of the blood,strong affection for another arising out of kinship or personal ties,warm attachment/enthusiasm/devotion,to feel great affection for|",
    "paa|like|V.|to feel attraction toward or take pleasure in|",
    "ota|but,exception|Cjn.,Prep.|except for the fact,other than|",
    "fazhapapshopaa|sorry,apology,apologize|Adj.,N.,V.|feeling extreme sorrow or sympathy,an admission of great error or discourtesy accompanied by an expression of great regret,to express great regret for something done or said|",
    "fazhapaa|sorry,apology,apologize,excuse|Adj.,N.,V.,V.,V.|feeling sorrow or sympathy,an admission of error or discourtesy accompanied by an expression of regret,to express regret for something done or said,to make apology for,to forgive entirely or disregard as of trivial import|",
    "shako|god,goddess queen|N.|the being perfect in power/wisdom/goodness who is worshipped by Ictuza as ruler and conqueror of the universe|",
    "fazhop|up|Adv.,Prep.|in or into a higher position or level,used as a function word to indicate motion to or toward or situation at a higher point of|",
    "fazhup|down|Adv.,Adv.,Prep.|toward or in a lower physical position,to or toward a point away from the speaker or the speaker's point of reference,to a lower point or along/around/through/toward/in/into/on|",
    "fazhopapa|high|Adj.,Adv.,N.|rising or extending upward a great distance or a distance greater than others of its kind,at or to a high place/altitude/level/degree,a high point or level|",
    "fazhupapa|low|Adj.,N.|situated or passing below the normal level/surface/base of measurement/the mean elevation,something that is low|",
    "opapa|more|Adj.,Adv.|greater,to a greater or higher degree|",
    "upapa|less|Adj.|constituting a more limited number or amount|",
    "ushko|very|Adv.|to a high degree|",
    "shaa|than|Conj.,Prep.|used as a function word to indicate the second member or the member taken as the point of departure in a comparison expressive of inequality,in comparison with|",
    "fashofash|somewhat,so-so,normal,maybe|Adv.,Adj.,Adj.,Adv.|in some degree or measure,moderately well,conforming to a type/standard/regular pattern,perhaps|",
    "ushkonguho|confident|Adj.|full of conviction",
    "oouktuzha|foreign,weak|Adj.,Adj.|born in/belonging to/characteristic of some place or country other than the one under consideration,physically/mentally/intellectually deficient|",
    "paazh|want,desire|V.,N.|to have or feel need,conscious impulse toward something that promises enjoyment or satisfaction in its attainment|",
    "opa|from|Prep.|used as a function word to indicate a starting point of a physical movement or a starting point in measuring or reckoning or in a statement of limits|",
    "fazhu|under|Adv.,Prep.|in or into a position below or beneath something,below or beneath so as to be overhung/surmounted/covered/protected/concealed by|",
    "fazhko|for,because (2)|Prep.,Prep.,Conj.|used as a function word to indicate purpose,used as a function word to indicate duration of time or extent of space,for the reason that|",
    "fazhuu|beside|Prep.|by the side of|",
    "fazhapapshongu|mouth|N.|the natural opening through which food passes into the body of an animal|",
    "asho|eat|V.|to take in through the mouth as food|",
    "fazhupapshongu|neck|N.|the part of an animal that connects the head with the body|",
    "fazhuupapsho|arm|N.|a limb of an invertebrate animal|",
    "uusho|reach|V.,V.|to stretch out,to touch or grasp by extending a part of the body|",
    "faazhuupapsho|hand|N.|the body part at the end of the arm used as a grasping organ|",
    "auusho|grab|V.|to make the motion of seizing|",
    "fazhuku|front|N.,Adj.|the forward part or surface,of/relating to/situated at the front|",
    "fazhoku|back (1)|Adv.,Adj.|in or into the past,being at or in the back|",
    "fazhokupapsho|back (2)|N.|the rear part of the Ictuza body|",
    "zhu|wing,failure,fail|N.,N.,V.|one of the movable feathered or membranous paired appendages by means of which a bird/bat/insect is able to fly,lack of success,to be or become absent or inadequate|",
    "zhuzh|wings,fly,honor|N.,V.,N.|plural of wing,to move in or pass through the air with wings,respect that is given to someone who is admired|",
    "fazhupapsho|leg|N.|a limb of  an animal used especially for supporting the body and for walking|",
    "zhupsho|penis,fuck (1)|N.,V.|a male copulatory and erogenous organ,to engage in coitus with|",
    "zhupapshopaa|intimate,intimacy|Adj.,N.|marked by very close association/contact/familiarity,the state of being intimate|",
    "psho|fuck (2), fucking|Intj.,Adj.,Adv.|expression of anger/contempt/disgust,used to intensify a word,used to intensify a word|",
    "zhuzha|vagina|N.|a canal in a female Ictuza comprised of an ovipositor and ovipore|",
    "faazhupapsho|foot|N.|the terminal part of a leg upon which an individual stands|",
    "aazhusho|kick|V.|to strike, thrust, or hit with the foot|",
    "shop|here|Adv.,N.|in or at this place,this place|",
    "shap|there|Adv.,N.,Pn.|in or at that place,that place,used as a function word to introduce a sentence or clause|",
    "shafo|away|Adv.,Adj.|from this or that place,distant in space or time|",
    "opunguho|say|V.|to express in words|",
    "ngusho|feel,react|V.,V.,V.|to receive or be able to receive a tactile sensation,to be conscious of an inward impression/state of mind/physical condition,to change in response to a stimulus|",
    "oa|but,except|Cjn.,Cjn.,Prep.|except for the fact,with this exception,with the exception of|",
	  "nguhoqosh|understand|V.|to grasp the meaning of|",
    "ngupapa|happy,happiness|Adj.,N.|enjoying or characterized by well-being and contentment,a state of well-being and contentment|",
    "ngupapau|hopeful,hope|Adj.,N.|having qualities which inspire hope,a feeling of expectation and desire for a particular thing to happen|",
    "ngupapaa|excited,excitement|Adj.,N.|having/showing/or characterized by a heightened state of energy/enthusiasm/eagerness,the state of being excited|",
    "ngupo|sad,sadness|Adj.,N.|affected with or expressive of grief or unhappiness,the quality or state of being sad|",
    "nguposho|melancholic,melancholy|Adj.,N.|of/relating to/subject to melancholy,depression of spirits|",
    "nguqa|surprised,surprise|Adj.,N.|feeling or showing surprise because of something unexpected,the feeling caused by something unexpected or unusual|",
    "ngub|numb,numbness|Adj.,Adj.,V.,N.|unable to think/feel/react normally because of something that shocks or upsets you,unable to feel anything in a particular part of your body,to make (someone or something) numb,a lack of emotion or emotional expressiveness|",
    "nguosha|neutral,neutrality|Adj.,N.|not decided or pronounced as to characteristics,the quality or state of being neutral|",
    "nguhoshazh|angry,anger|Adj.,N.|feeling or showing anger,a strong feeling of displeasure and usually of antagonism|",
    "nguhoshazhko|furious,fury|Adj.,N.|exhibiting or goaded by anger,intense/disordered/often destructive rage|",
    "nguhongu|curious,curiosity|Adj.,N.|marked by desire to investigate and learn,desire to know|",
    "nguhob|doubtful,doubtfulness|Adj.,N.|lacking a definite opinion/conviction/determination,the quality or state of being doubtful|",
    "akozhat|disgusted,gross,disgust|Adj.,Adj.,N.,V.|disturbed physically or mentally by something distasteful,glaringly noticeable usually because of inexcusable badness or objectionableness,marked aversion aroused by something highly distasteful,to provoke to loathing/repugnance/aversion|",
    "akozhoo|guilty,guilt|Adj.,Adj.,N.|aware of or suffering from guilt,justly chargeable with or responsible for a usually grave breach of conduct or a crime,feelings of deserving blame especially for imagined offenses or from a sense of inadequacy|",
    "akozhqa|stressed,stress|Adj.,N.|subjected to or affected by stress,a physical/chemical/emotional factor that causes bodily or mental tension|",
    "akozhqashta|anxious,anxiety|Adj.,N.|characterized by extreme uneasiness of mind or brooding fear about some contingency,apprehensive uneasiness or nervousness usually over an impending or anticipated misfortune|",
    "akozhto|embarassed,embarassment|Adj.,N.|feeling or showing a state of self-conscious confusion and distress,the state of being embarrassed|",
    "akozhob|powerless,tired,powerlessness|Adj.,Adj.,N.|devoid of strength or resources,drained of strength and energy,the quality or state of being powerless|",
    "shpozhob|bore|V.|to cause to feel weariness and restlessness through lack of interest|",
    "kofazhob|sleep|V.|to rest in a state of sleep|",
    "opupapshongu|head|N.|the upper or anterior division of the Ictuza body that contains the brain/the chief sense organs/the mouth/mandibles/antannae|",
    "fazhukupapsho|chest|N.|the part of the Ictuza body enclosed by the ribs and sternum|",
    "fazhuouk|almost|Adv.|very nearly but not exactly or entirely|",
    "fako|that (2)|Cjn.|used as a function word to introduce a noun clause that is usually the subject or object of a verb or a predicate nominative|",
    "shpotazho|scatterer|N.|a hammer-and-pick-like tool designed to break apart large flat pieces of soft rock or ice and scatter them from each other|",
    "shpota|scatter,share (1)|V.,V.|to separate and go in various directions,to apportion and take shares of something|",
    "shpot|piece,share (2)|N.,N.|a part of a whole,a portion belonging to/due to/contributed by an individual or group|",
    "shput|give|V.|to provide to someone else|",
    "shpupapa|help|V.,N.|to give assistance or support to,the act or an instance of doing or supplying something to make it easier for another to complete a task",
    "zhpang|reveal|V.,N.|to make (something secret or hidden) publicly or generally known,the act of reavealing something|",
    "shponguho|feeling,reaction|N.,N.|an emotional state or reaction,a response to some treatment/situation/stimulus|",
    "kosh|hurt|V.,V.|to inflict with physical pain,to cause emotional pain or anguish to|",
    "humbo|tree|N.,N.|a woody perennial plant having a single usually elongated main stem generally with few or no branches on its lower part,something in the form of or resembling a tree|",
    "humb|branch (1)|N.|something that extends from or enters into a main body or source|",
    "huumb|branch (2)|V.|to extend in different directions from a main part or point|",
    "aqo|rule|N.|a prescribed guide for conduct or action|",
    "oupaqo|if|Cjn.|on condition that|",
    "fazhoupaqo|then|Adv.|as a necessary consequence|",
    "shakoha|magic|N.,N.|the use of means believed to have supernatural power over natural forces,a general term for the effects produced by the influence of arcanons|",
    "shka|crystal|N.|a body that is formed by the solidification of a chemical element/compound/mixture and has a regularly repeating internal arrangement of its atoms and often external plane faces|",
    "shakot|spellcast,cast|V.,V.,V.|to put forth,to cast a spell,to harness the release of arcanons from a charged crystal|",
    "akozhotufposh|co-dependency|dependence on the needs of or on control by another|",
    "kofazhouk|become|V.|to undergo change or development|",
    "nguhunguho|intend,mean|V.|to have in mind as a purpose or goal|",
    "fazhupo|open|V.|to make available for entry or passage by turning back|",
    "zhupo|open|Adj.|being in a position or adjustment to permit passage|",
    "ofazhupo|close|V.|to move so as to bar passage through something|",
    "ozhupo|closed|Adj.|not open|",
    "tufoa|name|N.|a word or phrase that constitutes the distinctive designation of a person or thing|",
    "akazhoba|late|Adj.|far advanced toward the close of the day or night|",
    "shpotuho|music|N.|vocal/instrumental/mechanical sounds having rhythm/melody/harmony",
    "shpotuhosh|song|N.|a short musical composition of words and music",
    "shpotuuosh|instrument|N.|a device used to produce music",
    "fotapuuosh|percussion,percussive instrument|N.|percussion instruments that form a section of a band or orchestra",
    "shkapo|magic piano,crystal piano|N.|a musical instrument having 3 magic crystals each with 32 hammers each operated from a keyboard"
  ];
  
  invisible = ['/', '|', '<'];
  topThin = ['k','b','.']
  thin = ['|', 'zh', 'S|'];
  bottomThin = ['p','?'];
  topSlant = ['sh','ou','a'];
  bottomSlant = ['k','.','!'];
  backBottomThin = ['t'];
  backBottomSlant = ['ng','a','mb','k'];
  short = ['u','o','sh','ou','f','Qu','zh'];
  wide = [];
  double = ['sh', 'zh', 'mb', 'ou', 'ng', 'Qu','S/', 'S|'];

  constructor(className) {
    super(className);
  }
}

class NjeShua extends Dictionary {
  rawEntries = [
    "nge|what",
    "da|very good",
    "bon|good,correct",
    "na|yes",
    "naer|yes-ish,sort-of (1)",
    "ka|no",
    "kaer|no-ish,sort-of (2)",
    "aho|hello",
    "kaeo|goodbye,bye",
    "ra'ah|angry",
    "ulu|sad",
    "ramuulu|frustrated",
    "iberang|fight",
    "mulaya|scared",
    "fusu|calm",
    "bo|neutral",
    "bon'a|happy",
    "mushi|laughing",
    "msh|lol",
    "sub|brain",
    "subo|head",
    "sube|think,thought",
    "sub'gu|idea",
    "bonsu|understand",
    "ka bonsu|don't understand",
    "yda'sube|bad idea",
    "ur'sube|remember",
    "ka ur'sube|forget",
    "subea|learning",
    "subea'tupo|school",
    "kuku|crazy",
    "n'ibe|who",
    "n'ur|when",
    "nge'mi|why",
    "nge'na|how",
    "n'yo|where",
    "verkadi|religion",
    "verkadi-bon|heaven",
    "verkadi-yda|hell",
    "verkadi'be|priest",
    "iesus-verdi|christianity",
    "iesus|jesus",
    "kor'an-verdi|judaism",
    "aialo|sense",
    "ala|move",
    "ash|hand",
    "ashna|feel",
    "inn|nose",
    "inna|smell",
    "a|mouth",
    "ana|eat",
    "lynn|ear",
    "lynna|hear",
    "fufu|hair",
    "subo|bald",
    "asha|arm",
    "jal|leg",
    "jali|foot",
    "beta|neck",
    "sura|chest",
    "sarang|heart",
    "ashiir|wrist",
    "murai|stomach",
    "dshyu|elbow",
    "tokia|knee",
    "jali|ankle",
    "jaleni|toes",
    "gur'vei|bone",
    "ana'gurvei|tooth",
    "jala|walk",
    "jala'pi|run",
    "mala'pi|fast crawl",
    "mala|crawl",
    "jala'jan|path",
    "njejala|fly",
    "shu|word",
    "shi|is",
    "ki|and",
    "ama|same,equals",
    "io|or",
    "ta|that",
    "bi|in",
    "bia|to",
    "'ma|plural",
    "shulo|stop",
    "esie|i",
    "nulu|you",
    "ibe|them (1),them (2nd S.)",
    "almas|us",
    "alm|it,thing",
    "nulualm|them (2),them (P.)",
    "kalmas|them (3),them (3rd. S.)",
    "yuka|help",
    "grasi|thank you",
    "nari|sorry",
    "tilla|take",
    "shin|give",
    "ok'si|opposite",
    "ro|make",
    "biala'shu|detail",
    "bian|change",
    "balam|color",
    "san|red",
    "lani|orange",
    "mele|yellow",
    "ven|green",
    "zuke|blue",
    "zukan|purple",
    "isa|pink",
    "nunai|black",
    "ilo|white",
    "rah-balam|warm colors,warm colored",
    "mide-balam|cool colors,cool colored",
    "fusu|clean",
    "kablam|dirty",
    "nulani|brown",
    "nunai'lo|grey,gray",
    "bon'lam|shiny",
    "kabonlam|gross",
    "piri|tiny",
    "pir'su|small",
    "ama|mid-sized,medium",
    "su'pir|large",
    "suma|huge,very",
    "hega|measurement",
    "'na|ordinance",
    "kusham|number,base",
    "kus|plus",
    "mako|minus",
    "dingi|divide",
    "sumokus|multiply,times",
    "koa|hard",
    "pol'gurr|soft",
    "'suuna|maker",
    "ana'suuna|chef",
    "okome'suuna|artist",
    "shu'suuna|writer",
    "jalaokomi|film",
    "jan|gym",
    "jan'suuna|gymnastics",
    "janlynn|dancing",
    "jaly'suuna|ballet",
    "kalma'gu|puzzle",
    "mide|tired",
    "midena|sleep",
    "midena'gu|bed",
    "altu'gu|furniture",
    "altro|construction (1),construction (topic)",
    "altro'ibe|construction worker",
    "altro'gu|construction (2),construction (noun)",
    "kumo|fabric",
    "ibe-kumo|clothing",
    "kumo-suuna|sewing",
    "kum'ibe|sewing",
    "kum'be|sewer,one who sews",
    "njele|north",
    "ville|west",
    "melle|south",
    "hyllie|east",
    "tenvel|here",
    "kenagu|hole",
    "danagu|hill",
    "lagja'vei|country",
    "vro'jan|road",
    "vro|car",
    "bam'gu|gear",
    "jalam'gu|vehicle",
    "ahkeo'gu|door",
    "tupo|house",
    "pir'katu|room",
    "alto|building",
    "altu|government,government building",
    "lavvu|big house",
    "makit|retail store,store",
    "su'makit|company,mall",
    "yda'sham|negative",
    "bon'sham|positive",
    "kalma'sham|fraction",
    "kama|not equal",
    "pama|similar",
    "shusham|word",
    "pi'shu|letter",
    "anjele|sky",
    "rinje|cloud",
    "aya|fire",
    "rinje-aya|smoke",
    "mel|dirt",
    "i|of"
  ];

  buildEntry(rawEntry) {
    let elements = rawEntry.split("|");
    let key = elements[0];
    let name = this.toTitleCase(key);
    let translation = this.toTitleCase(elements[1].replaceAll(',', ", "));
    let entry = `<div>${name} | ${translation}</div>`;

    return entry;
  }  

  constructor(className) {
    super(className);
  }
}

class Crystal extends Dictionary {
  rawEntries = ['diamond|887|round|temperature 2|spherical'];

  buildEntry(rawEntry) {
    let elements = rawEntry.split("|");
    let key = elements[0];
    let name = this.toTitleCase(key);
    let frequency = elements[1];
    let cuts = this.toTitleCase(elements[2]);
    let effects = elements[3].split(',');
    let effectShape = this.toTitleCase(elements[4]);
    let entry = `<div>${name}<br>Fusing Frequency: ${frequency} hz<br>Cuts: ${cuts}<ul>`;

    for (let i = 0; i < effects.length; i++){
      entry += `<li>${this.toTitleCase(effects[i])}</li>`;
    }

    entry += `</ul>Effect Shape: ${effectShape}</div><hr class='headerSeperator'/>`

    return entry;
  } 
}

const classMap = new Map();

// Add all classes into map
classMap.set("ictukV5", new IctukV5("ictukV5"));
classMap.set("njeShua", new NjeShua("njeShua"));
classMap.set("crystal", new Crystal("crystal"));
let conlang;

//For html calling
function updateResult(query = ""){
  conlang.updateResult(query);
}
function checkQuestion(id, correctAnswer){
  conlang.checkQuestion(id, correctAnswer);
}

async function copyToClipboard() {
    const container = document.getElementById("drawAsync");
    
	if (!container) throw new Error("drawAsync not found");

    const svg = container.querySelector("svg");
    
	if (!svg) throw new Error("No SVG inside drawAsync");

    // Clone svg
    const clonedSvg = svg.cloneNode(true);
    // Ensure defs are inside cloned SVG
    const defs = document.querySelector("svg defs");
    
	if (defs && !clonedSvg.querySelector("defs")) {
        clonedSvg.prepend(defs.cloneNode(true));
    }

    // Ensure namespaces
    clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clonedSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
	
    // Serialize
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    // Blob URL
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    // Load image
    const img = new Image();

    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
    });

    // Canvas sizing
    const vb = svg.viewBox?.baseVal;
    const width = vb?.width || svg.clientWidth || 300;
    const height = vb?.height || svg.clientHeight || 150;
    const canvas = document.createElement("canvas");
    
	canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
	
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);

    // Export as PNG
    const pngBlob = await new Promise(resolve => {
        canvas.toBlob(resolve, "image/png");
    });

    if (!pngBlob) throw new Error("PNG conversion failed");

	// Write to clipboard
    await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob })
    ]);
}

window.dictionaryInit = function(className) {
  conlang = classMap.get(className);
  const entry = document.getElementById("entry");
  
  conlang.buildEntryMaps();
  
  if (entry) {
		conlang.updateResult();
	}
  
  const glyphs = document.querySelectorAll(".draw");
  
  for (var i = 0; i < glyphs.length; i++) {
    let svg = conlang.draw(glyphs[i].dataset.phrase);
    glyphs[i].innerHTML = svg;
  }
  //Listen for user parser event
  const userParser = document.getElementById("userParser");

  try {
    userParser.addEventListener("input", function (event) {
      document.getElementById("drawAsync").innerHTML = conlang.draw(userParser.value);
    });
  } catch {
    console.log("No parser input element found.");
  }
};

/*
  BLOG CODE
  Helps to compress index.html by putting all of the blogs in a delimited string list and building them onload
  Raw entries are formatted datetime|header|content
*/
class Blog {
  rawEntries = [
    `d033026t1740|Hello, world!|I wanted to overhaul my website a bit, as it was a little gross to look at. Coincidentally, I'm rebuilding it exactly one year after I last updated it. I would like to post semi-frequently here, no promises though, school has me pretty swamped, but maybe that's something I can talk about. Who knows! Admittedly, I'm still not experienced at all in HTML, but I have a little more patience to research now than I was last year. Still though, I'm warning you now if you decide to tread through my code, as it could be pretty attrocious, I dunno (I promise I'm better at backend, lol)."`,
    `d040126t1432|Shutting this site down...|April fools! I'm probably about 75% of the way there with getting this site done. My biggest endeavor, which I saved for last, is the <a href="interestsPage.html">interests page</a>, and its constituent pages. I intend on implementing the documentation for <a href="docPages/galusSystem.html">my world</a> and all of my conlangs, which luckily both things already have docs that I just need to organize in HTML.\n In other news, I am behind on school work, which is dreadful, but after making a to-do list of the things I need to do, it doesn't seem nearly as lengthy as it's felt."`,
    `d040226t1000|Creative Writing Prompt 1|When I was in highschool, I was in a creative writing club. This particular post had 4 restrictions: <ol> <li>Limit: 250 words (I used 247)</li> <li>Genre: Drama</li> <li>Phrase (large idea of narrative): People watching</li> <li>Word Required: Enter/enters</li> </ol> <strong>Fun Fact:</strong> The 1st couple sections (or paragraphs technically) are pulled from the prologue of my book at the time. \n<strong>What I Wrote</strong> \n\t\tThe surrounding area makes a stinging iciness run down my spine that makes my heart pound harder than a hammer to a nail. Visions rush to my mind, an excruciating shock plunging deeply into the very depths of my body. Before I could even think of acting, agonizing pain and chill vanishes in an instant, and the discernment of anything dissipates. \n\t\tThe only perceptible sense was sight, as if my imagination had suddenly sparked like it had done in my early years of childhood. The glare of what seemed to be a star grows at a blinding rate, before revealing green fields, the warmth of a summer day feeding nostalgia of my past. \n\t\tPanicked, I turned towards the direction of the question. Staring at me with a curious look was a little girl, about 5 years old, with long braided hair. A brunette, hazel eyes, that looked of Spanish descent. \n\t\t<i>What?</i> The word becomes lost, air escaping my lips like it was ripped out of my body. \n\t\t"That you helped destroy them?" Her innocence was unearthly. \n\t\tA piercing headache cuts through my mind and a vision of blurry humanoids forms into my line of sight. Loud beeping pounds my eardrums, and the only meager detail I can apprehend is the fear of everyone watching and working as they try to solve the cause of their distress.\n \t\tSeveral more people enter the room with great haste, panicked sweat glistening in fluorescent lighting. \n\t\t"We're losing her!"`,
    `d040726t2210|Karaoke + Linux (Inevitable Jank)|I've recently learned that there is software to program karaoke songs, so I may have a new hobby. For some context, my girlfriend's family loves to do karaoke, and the software they use is called <a href="https://www.karafun.com">Karafun</a>. The program I currently use is called CDG Magic, which in order to run on my work laptop (that runs <a href="https://mxlinux.org">MX Linux</a>), I had to run a program called <a href="https://usebottles.com">Bottles</a>. Then, I realized the program only took WAV files, and required a very specific header format. To fix this, I found a <a href="https://www.reddit.com/r/ffmpeg/comments/kepmsa/comment/gg9esxk/?force-legacy-sct=1">forum post</a> that recommended using sox to convert an mp3 into a WAV, and that finally worked. So now I'm making a karaoke file for <a href="https://www.youtube.com/watch?v=xIoXE4q-Jes">Against the Kitchen Floor</a> by Will Wood.`,
    `d041726t1327|It was only a matter of time|I avoided it for as long as I can, but alas, I finally had to use JavaScript. I know, it's a terrible fate, I accept your grievances... \nAnyhow, I had to use it to make a dictionary lookup thing for the (WIP) 6th version of <a href="docPages/ictuk/ictukV6.html">Ictuk</a>. I'm honestly pretty proud of it, it took some time and a lot of <a href="https://www.w3schools.com">w3schools</a> lookups. My hope for the dictionary is to make an easy-to-use word search for when someone forgets a word when using the language. My original solution to this problem was to make a "light dictionary" tab in a Google sheet I used to V5, with one column being Ictuk words and the other being English, and it worked...okay, but Ictuk shares some letters with English, and CTRL+F on Google sheets uses some form of <a href="https://en.wikipedia.org/wiki/Regular_expression">Regex</a>, so more often than not I'd still end up sifting through the dictionary that was intended not to be sifted through in the first place. With my new dictionary code, you can look up a specific word from either Ictuk or English, and it will pop up if there's a match (not case sensitive). As of making this post, there are only 2 Ictuk words, <i>kofa</i> and <i>o</i>.`,
    `d050926t1738|Summer break!|I'm finally free from this rough college semester. For the next 3 months, I'm mostly gonna be working, but past that I'm planning on racing with my dad, working on passjon projects (maybe finally working on my game lol), and I will especially be working on this site. Just this weekend I completely refactored my JavaScript code to be more object oriented, and I feel more sane looking at it than before it was refactored. Of course, being JavaScript, even the OOP-side has its quirks in syntax, but they're tolerable. There's currently 4 classes as of writing this: Dictionary, which is a parent class for all dictionary related functions (populating and filtering entries) in the conlang documentation pages, IctukV5 and IctukV6, which are child classes for Dictionary, and Blog, which uses the same formatting and functions as Dictionary, but for the blog posts instead. Both of the parent classes hopefully can make the HTML files noticeably smaller, and make my life easier by automating entries instead of me writing them individually.`,
    `d051326t1540|New parser! That was miserable|I just finished creating and implementing a parser for <a href="https://selisine.onrender.com/docPages/ictuk/ictukV5.html">Ictuk</a>'s glyph system. It doesn't fully translate (yet?), but it can take in a specially-formatted string that generates the glyphs for me, which has already proved to be much faster than manually having to paste and adjust group references in SVG. I would like to add the ability to change the text color so I can replace the highlighted character examples (like all the ones in <a href="https://selisine.onrender.com/docPages/ictuk/ictukV5.html#Writing">the writing section</a>. I would also like to add a section for user-input, in case someone wants to use it for chatting. I'll post a guide when I make it more user oriented. Overall, it's very rough around the edges, and implementing it into my Dictionary class structure has showed me that I need yet another refactoring, but that's for another day.\nHere's an example with "kofafashbut?". The string for this would be "0kofabut? 1///&#124;fash".\n<img src="resources/ictukV5/glyphs/kofabutfashQuestionMark.png">`,
    `d072226t1049|33 Days Left...|A little over a month of my summer break left, and so much has occured in the past 2 months. Apologies for not posting in said 2 months, I honestly just forgot, and I've been bouncing around projects. Worldbuilding has been my main focus, and worldbuilding I've done. After a good few revisions, I've added a <a href="docPages/omi.html">magic system</a>, and for Ictuk I've added a <a href="docPages/systems/galus.html">star system</a>, <a href="docPages/species/vemachiaSapiens.html">species</a>, and <a href="docPages/nations/suko.html">nation</a> page. I like to bounce between each one if I start getting burnt out working on one of them, the only caveat to this being that every page is a work in progress in some way. This isn't the end of the world, and it might get people to check in for new content, but that's the silver lining. I think if there was required incentive like "I have to complete A to allow ads" then I'd probably be more on top of it, but I'm just doing it as go cause I enjoy it. There will not be ads on this site ever, and if I break that promise I will personally allow someone to dump 3 gallons of hydrocloric acid directly onto my head. There'll be a whole laminated contract and everything, I'll frame it and put it right next to the <i>Declaration of Independence</i>, just don't let Nicholas Cage know about it; he might make another National Treasure.\nJokes aside, I've been thinking about ways to navigate these docs, and I think I'm gonna make a database thing where you can filter by what you want and which broad categories it's apart of. It's quite daunting, more than the parser (which has also gone through a lot of changes). I also want to start on my next language soon, but I'm not sure when to cut myself off with the documentation for Ictuza and Ictuk. Ictuk has structurally been done for a bit, but I had these ideas for a learner's guide for all the normal people who don't read fictional linguistic documentation as a hobby. It would work as a little booklet with units to get you through the basics of grammar, writing, and sound. That's probably where I'll stop with Ictuk development, and just invent words whenever necessary (hence the programmatic dictionary code). My next language will be Qvefozian (kay-voh-zhuhn), spoken by a species of frog-bird people known as Qvefoz. Thinking about it now, both speakers of my conlangs are named after their conlangs, which is the equivalent of calling English-speaking humans "Englishians" or something of the sort, so I'll probably change the Qvefozians' names. Anyhow, my only idea for the language right now is that it's highly inflectional, with one of the main gimmicks being the letter O for them. I want them to have some set of sounds and accented letters that stem from the letter O, like &#210; is "ow", &#211; is "or", &#212; is "oear", etc. I am not sure if I want to give them glyphs or not.\nFinal thing, I got commissioned to remake someone's website, for money! This is the first time ever I've been commissioned for something, and so far it's going okay. I am not the best at HTML5 (as you can see by my website lol), but I am pretty good at Googling things and planning out designs. With the person's permission I will probably add it to my <a href="careerPage.html">career page</a> once I'm done.` 
  ]

  // Helper method for buildAllEntries
  buildEntry(rawEntry){
    let elements = rawEntry.split("|");
    let datetime = elements[0];
    let header = elements[1];
    let content = elements[2];
    let entry = `<div id="${datetime}"><h1>${header}</h1><sub>`;
    
    //Format datettime for subtext
    let month = datetime.substr(1, 2);
    let day = datetime.substr(3, 2);
    let year = "20" + datetime.substr(5, 2);
    let militaryHour = parseInt(datetime.substr(8, 2));
    let minute = datetime.substr(10, 2);
    let hour =
        (militaryHour % 12 === 0)
        ? 12
        : militaryHour % 12;
    let meridiem =
        (militaryHour >= 12)
        ? "PM"
        : "AM";

    //Make escape chars into html equivalent 
    content = content.replaceAll('\t', "&emsp");
    content = content.replaceAll('\n', "<br>");
    
    entry += `${month}/${day}/${year} `;
    entry += `${hour}:${minute} ${meridiem}`;
    entry += `</sub><br><p>${content}</p></div>`;
    entry += `<hr class="headerSeperator"/>`;

    return entry;
  }

  // Helper method for buildAllEntries
  buildHeaderLink(rawEntry){
    let elements = rawEntry.split('|');
    let datetime = elements[0];
    let header = elements[1];
    let entry = `<a class="headerLink" href="#${datetime}">${header}</a>`
    entry += "<hr class=\"headerSeperator\">"

    return entry;
  }

  buildHeaderLists(){
    let list = "";

    for (let i = this.rawEntries.length; i > 0; i--) {
      list += this.buildHeaderLink(this.rawEntries[i-1]);
    }

    document.getElementById("headers").innerHTML = list;
  }

  listAllEntries() {
    let list = "";

    for (let i = this.rawEntries.length; i > 0; i--) {
      list += this.buildEntry(this.rawEntries[i-1]);
    }

    document.getElementById("entry").innerHTML = list;
  }
}

let blog = new Blog();

function blogInit(){
  blog.buildHeaderLists();
  blog.listAllEntries();
}

class Writing extends Blog {
  rawEntries = [
    `d082526t2000|Trapped|These hands aren't mind,\nThese breaths aren't mind,\nThese tears aren't mine,\nThese hairs aren't mine\n\nThis body is a shell,\nand a mechanism from hell,\nto keep me contained,\nlike a cage\n\nWhy'd they put me here,\non this Earth,\nin this body?\nI didn't ask for this,\nI want a home not a prison\n\nThere are things on this Earth,\nthat make my prison a home,\nbut I don't know if I can wait any longer,\nto get to my real home`,
    `d082726t1030|The Sun|She was born beautiful and bright,\nfull of grace and light,\nwhich she shared to all her children\n\nShe was born an artist,\neager to paint what she reached,\nto bring beauty to a world which could not see it\n\nThe world saw her beauty, alas\nthe world couldn't thank her,\nfor her beauty was too bright`,
    `d090526t0030|To Midnight|Despite all my efforts,\nto bring myself happiness,\nI sit and write this poem,\n10 minutes to midnight\n\nI exercise nightly,\n2 hours to midnight,\nto reshape myself,\nand bring myself happiness\n\nI train my voice,\n1 hour to midnight,\nto sound effiminate,\nand bring myself happiness\n\nI search within myself,\n30 minutes past midnight,\nto find the rest of me,\nand bring myself happiness`,
    `d090626t0345|Boulder|Nothing has been working the way I wanted it to,\nEveryone tell me,\n"Oh it'll get better",\n"You're just in a rought spot",\n"You're still young",\nIt's the world's most politely optimistic boulder,\nbarreling towards me down a steepening hill,\nwhere my options are to tumble ferociously, or\nallow the boulder to finally take me,\ncrushing me with such a weight,\nthat my troubles are displaced, but\nmany find there to be just one option,\nto keep tumbling,\nto assume that the ever-enclosing boulder will just,\n"go away",\nto assume that there is an end to this hill,\nthat it won't eventually become so steep,\nthat it's nothing more than a cliff,\nwith no bottom,\nI once thought,\nthat the hill elevated once or twice, but\nit was a change so minimal,\nthe steepness consumed it`,
    `d090626t2317|Reminiscence of a Marigold|Despite our agreed-on distance,\nI still think of you,\nyour smell,\nyour touch,\nyour taste,\nAnd I know you think of me,\nmy smell,\nmy touch,\nmy taste,\nDo you think of me,\nwhen you think of him?\nwhen you smell him,\nwhen you touch him,\nwhen you taste him?\nDid you think of me,\nall those nights,\nyou lie on your back,\nlegs high in the air,\nwhile he gets your smell,\nwhile he gets your touch,\nwhile he gets your taste?`,
    `d090726t1940|To Midnight (Version 2)|In spite of my search,\nto quiet my dissonance,\nI compose my psyche,\n10 minutes to midnight\n\nI amelionate this prison,\nmolding this flesh and bone,\nto feel the warmth of a home,\n2 hours to midnight\n\nI talk to the stars,\nand listen to their beauty,\nto learn their tone,\n1 hour to midnight\n\nI search for a medley,\nfull of vibrance and pride,\nfeel it dance in my mind,\n30 minutes past midnight`,
    `d090826t2129|Songbirds|Songbirds are born,\ngifted with a talent,\nto spread grace throughout,\nthe invisible air\n\nOne bird was born,\nwith no thought in its mind,\nbut to devour gravel,\nand squak for its life\n\nThe other birds abhor,\nthis gravel-stricken pest,\nthey didn't deserve this,\n"Get away from us!"\n\nThe bird quickly realized,\nit needs to fit in,\nit stops eating gravel,\nand sings from within\n\nBut the damage was done,\ntoo many rocks in its throat,\nthe weight of its voice,\nmade itself choke`
  ];
}

let writing = new Writing();

function writingInit(){
  writing.buildHeaderLists();
  writing.listAllEntries();
}