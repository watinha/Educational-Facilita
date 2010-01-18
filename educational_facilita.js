/*
  ***********************************************************
  *** Jetpack name: Educational Facilita                  ***
  *** Version: 0.2                                        ***
  *** Authors: Willian Massami Watanabe, Arnaldo Candido  ***
  ***          Jr., Marcelo Adriano Amancio e Matheus de  ***
  ***          Oliveira                                   ***
  *** Contact: watinha@gmail.com                          ***
  *** Last changes: 16/01/2010                            ***
  ***********************************************************
*/
/*
  Development log:
    - Version 0.1: Readability Module 0.5 for textual extraction of the site
    - Version 0.2: Separating objects (Educational_Facilita, ui_manager and readability) accordingly to its functionality and inserting the JQuery UI module dinamically on websites.
*/

var Educational_Facilita = {
  version: 0.2,
  constants: {
    DIALOG_LOADING_ID: "educational_facilita_loading"  
  },
  javascript_snippets: {
    DIALOG_LOADING_JS: "$('#educational_facilita_loading').dialog({modal: true, height: 90, zIndex: 99999, draggable: false, hide: 'slide', closeOnEscape: false, dialogClass: 'educational_facilita_loading', resizable: false}); $('div.educational_facilita_loading').css({MozBoxShadow: '10px 10px 5px #333', position: 'fixed'}); $('span.ui-icon-closethick').remove(); $('div.ui-dialog-content').css({textAlign: 'center', padding: '20px'});",  
    DIALOG_LOADING_HTML: <>
      <div id="educational_facilita_loading" title="Aguarde...">
        <img alt="carregando o Facilita Educational" src="http://localhost/~watinha/jquery/loading3.gif" />
      </div>   
    </>
  },
  initial_loading: function(){
    var document_tab = jetpack.tabs.focused.contentDocument;
    if($("#" + this.constants.DIALOG_LOADING_ID, document_tab).size() == 0)
      document_tab.body.innerHTML += this.javascript_snippets.DIALOG_LOADING_HTML;

    var script = document_tab.createElement("script");
    script.type = "text/javascript";
    script.innerHTML = this.javascript_snippets.DIALOG_LOADING_JS;

    document_tab.getElementsByTagName("head")[0].appendChild(script);
  },
  initialize: function(){
    var main_element = readability.grabArticle(jetpack.tabs.focused.contentDocument);
    
    // finishes if there is no main element
    if(main_element == null){
      jetpack.notifications.show("Nã há texto suficiente para ser processado nessa �gina.");
      return 0;
    }
      
    $(jetpack.tabs.focused.contentDocument.body).append(readability.to_text(main_element));
    ui_manager.include_jquery_ui(jetpack.tabs.focused.contentDocument); 

    this.initial_loading();
  }

};

/*
 * JQuery UI inclusion object
 * Object which inserts the Jquery UI files and dependencies from 
 *  a specific server available on the web.
 * Author: Willian Massami Watanabe
 */

var ui_manager = {
  version: 0.1,
  constants: {
    JQUERY_ID: "educational_facilita_jquery",
    JQUERYUI_ID: "educational_facilita_jqueryui",
    JQUERYUI_CSS_ID: "educational_facilita_jqueryui_css",

    JQUERY_URL: "http://localhost/~watinha/jquery/js/jquery-1.3.2.min.js",
    JQUERYUI_URL: "http://localhost/~watinha/jquery/js/jquery-ui-1.7.2.custom.min.js",
    JQUERYUI_CSS_URL: "http://localhost/~watinha/jquery/css/ui-lightness/jquery-ui-1.7.2.custom.css"
  },

  /*
   * Function include_jquery_ui
   *  - Include the Jquery UI dependencies into any website
   *  - First checks if the page already contains the Jquery, Jquery UI, and Jquery UI CSS files
   *  - Next it includes the required files through OnDemand Javascript Approach and AJAX for the
   *  Javascript files, which require some sort of synchronization to be executed correctly.
   *  - Finally it concludes by inserting the javascript Jquery UI code to be executed from the
   *  website scope, rather than from the jetpack scope.
  **/
  include_jquery_ui: function(document_tab){
    if($("#" + this.constants.JQUERY_ID, document_tab).size() == 0){
      var jquery_element = document_tab.createElement("script");
      var jqueryui_element = document_tab.createElement("script");
      var jqueryui_css_element = document_tab.createElement("link");
   
      $(jquery_element).attr({
        type: "text/javascript",
        id: this.constants.JQUERY_ID
      });

      $(jqueryui_element).attr({
        type: "text/javascript",
        id: this.constants.JQUERYUI_ID
      });

      $(jqueryui_css_element).attr({
        rel: "stylesheet",
        type: "text/css",
        id: this.constants.JQUERYUI_CSS_ID,
        href: this.constants.JQUERYUI_CSS_URL
      });

      var head_element_tab = document_tab.getElementsByTagName("head")[0];
      head_element_tab.appendChild(jquery_element);
      head_element_tab.appendChild(jqueryui_element);
      head_element_tab.appendChild(jqueryui_css_element);
      
      $.ajax({
        type: "GET", 
        async: false,
        url: ui_manager.constants.JQUERY_URL,
        success: function(data_jquery){
          jquery_element.innerHTML = data_jquery;
          $.ajax({
            type: "GET", 
            async: false,
            url: ui_manager.constants.JQUERYUI_URL, 
            success: function(data_jqueryui){
              jqueryui_element.innerHTML = data_jqueryui;
            }
          });
        }
      });
    }
  }

};

/*
 * Readability. An Arc90 Lab Experiment. 
 * Website: http://lab.arc90.com/experiments/readability
 * Source:  http://code.google.com/p/arc90labs-readability
 * 
 *  *** CHANGED TO NOT REPLACE BUT ONLY FIND MAIN ELEMENT ***
 *
 * Copyright (c) 2009 Arc90 Inc
 * Readability is licensed under the Apache License, Version 2.0.
**/
var dbg = function(s) {
	if(typeof console !== 'undefined')
		console.log("Readability: " + s);
};
var readability = {
	version:     '0.5.1',
	emailSrc:    'http://lab.arc90.com/experiments/readability/email.php',
	kindleSrc:   'http://lab.arc90.com/experiments/readability/kindle.php',
	iframeLoads: 0,
	frameHack:   false, /**
	                     * The frame hack is to workaround a firefox bug where if you
						 * pull content out of a frame and stick it into the parent element, the scrollbar won't appear.
						 * So we fake a scrollbar in the wrapping div.
						**/
	bodyCache:  null,   /* Cache the body HTML in case we need to re-use it later */
	flags: 0x1 | 0x2,   /* Start with both flags set. */
	
	/* constants */
	FLAG_STRIP_UNLIKELYS: 0x1,
	FLAG_WEIGHT_CLASSES:  0x2,
	
	/**
	 * All of the regular expressions in use within readability.
	 * Defined up here so we don't instantiate them repeatedly in loops.
	 **/
	regexps: {
		unlikelyCandidatesRe:   /combx|comment|disqus|foot|header|menu|meta|rss|shoutbox|sidebar|sponsor/i,
		okMaybeItsACandidateRe: /and|article|body|column|main/i,
		positiveRe:             /article|body|content|entry|hentry|page|pagination|post|text/i,
		negativeRe:             /combx|comment|contact|foot|footer|footnote|link|media|meta|promo|related|scroll|shoutbox|sponsor|tags|widget/i,
		divToPElementsRe:       /<(a|blockquote|dl|div|img|ol|p|pre|table|ul)/i,
		replaceBrsRe:           /(<br[^>]*>[ \n\r\t]*){2,}/gi,
		replaceFontsRe:         /<(\/?)font[^>]*>/gi,
		trimRe:                 /^\s+|\s+$/g,
		normalizeRe:            /\s{2,}/g,
		killBreaksRe:           /(<br\s*\/?>(\s|&nbsp;?)*){1,}/g,
		videoRe:                /http:\/\/(www\.)?(youtube|vimeo)\.com/i
  },

	/**
	 * Initialize a node with the readability object. Also checks the
	 * className/id for special names to add to its score.
	 *
	 * @param Element
	 * @return void
	**/
	initializeNode: function (node) {
		node.readability = {"contentScore": 0};			

		switch(node.tagName) {
			case 'DIV':
				node.readability.contentScore += 5;
				break;

			case 'PRE':
			case 'TD':
			case 'BLOCKQUOTE':
				node.readability.contentScore += 3;
				break;
				
			case 'ADDRESS':
			case 'OL':
			case 'UL':
			case 'DL':
			case 'DD':
			case 'DT':
			case 'LI':
			case 'FORM':
				node.readability.contentScore -= 3;
				break;

			case 'H1':
			case 'H2':
			case 'H3':
			case 'H4':
			case 'H5':
			case 'H6':
			case 'TH':
				node.readability.contentScore -= 5;
				break;
		}

		node.readability.contentScore += readability.getClassWeight(node);
	},
	
	/***
	 * grabArticle - Using a variety of metrics (content score, classname, element types), find the content that is
	 *               most likely to be the stuff a user wants to read. Then return it wrapped up in a div.
	 *
	 * @return Element
	**/
	grabArticle: function (document_tab) {
		var stripUnlikelyCandidates = readability.flagIsActive(readability.FLAG_STRIP_UNLIKELYS);

		/**
		 * First, node prepping. Trash nodes that look cruddy (like ones with the class name "comment", etc), and turn divs
		 * into P tags where they have been used inappropriately (as in, where they contain no other block level elements.)
		 *
		 * Note: Assignment from index for performance. See http://www.peachpit.com/articles/article.aspx?p=31567&seqNum=5
		 * TODO: Shouldn't this be a reverse traversal?
		**/
		for(var nodeIndex = 0; (node = document_tab.getElementsByTagName('*')[nodeIndex]); nodeIndex++)
		{
			/* Remove unlikely candidates */
			if (stripUnlikelyCandidates) {
				var unlikelyMatchString = node.className + node.id;
				if (unlikelyMatchString.search(readability.regexps.unlikelyCandidatesRe) !== -1 &&
				    unlikelyMatchString.search(readability.regexps.okMaybeItsACandidateRe) == -1 &&
					node.tagName !== "BODY")
				{
					dbg("Removing unlikely candidate - " + unlikelyMatchString);
					//node.parentNode.removeChild(node);
          //nodeIndex--;
          /* *** CANT REMOVE ELEMENTS FROM THE ORIGINAL PAGE *** */
          $(node).addClass("removed_element");
					continue;
				}				
			}

			/* Turn all divs that don't have children block level elements into p's */
			if (node.tagName === "DIV") {
				if (node.innerHTML.search(readability.regexps.divToPElementsRe) === -1)	{
					dbg("Altering div to p");
					/*var newNode = document_tab.createElement('p');
					try {
						newNode.innerHTML = node.innerHTML;				
						node.parentNode.replaceChild(newNode, node);
						nodeIndex--;
					}
					catch(e)
					{
						dbg("Could not alter div to p, probably an IE restriction, reverting back to div.")
          }*/
          $(node).addClass("div_to_p");
				}
				else
				{
					/* EXPERIMENTAL */
					for(var i = 0, il = node.childNodes.length; i < il; i++) {
						var childNode = node.childNodes[i];
						if(childNode.nodeType == 3) { // Node.TEXT_NODE
							dbg("replacing text node with a p tag with the same content.");
							var span = document_tab.createElement('span');
							span.innerHTML = childNode.nodeValue;
							span.style.display = 'inline';
							span.className = 'readability-styled div_to_p';
              childNode.parentNode.replaceChild(span, childNode);
						}
					}
				}
			} 
		}

		/**
		 * Loop through all paragraphs, and assign a score to them based on how content-y they look.
		 * Then add their score to their parent node.
		 *
		 * A score is determined by things like number of commas, class names, etc. Maybe eventually link density.
		**/
		var allParagraphs = $("p, div.div_to_p, span.div_to_p", document_tab);//document_tab.getElementsByTagName("p");
		var candidates    = [];

		for (var j=0; j	< allParagraphs.length; j++) {
			var parentNode      = allParagraphs[j].parentNode;
			var grandParentNode = parentNode.parentNode;
			var innerText       = readability.getInnerText(allParagraphs[j]);

			/* If this paragraph is less than 25 characters, don't even count it. */
			if(innerText.length < 25)
				continue;

			/* Initialize readability data for the parent. */
			if(typeof parentNode.readability == 'undefined')
			{
				readability.initializeNode(parentNode);
				candidates.push(parentNode);
			}

			/* Initialize readability data for the grandparent. */
			if(typeof grandParentNode.readability == 'undefined')
			{
				readability.initializeNode(grandParentNode);
				candidates.push(grandParentNode);
			}

			var contentScore = 0;

			/* Add a point for the paragraph itself as a base. */
			contentScore++;

			/* Add points for any commas within this paragraph */
			contentScore += innerText.split(',').length;
			
			/* For every 100 characters in this paragraph, add another point. Up to 3 points. */
			contentScore += Math.min(Math.floor(innerText.length / 100), 3);
			
			/* Add the score to the parent. The grandparent gets half. */
			parentNode.readability.contentScore += contentScore;
			grandParentNode.readability.contentScore += contentScore/2;
		}

		/**
		 * After we've calculated scores, loop through all of the possible candidate nodes we found
		 * and find the one with the highest score.
		**/
		var topCandidate = null;
		for(var i=0, il=candidates.length; i < il; i++)
		{
			/**
			 * Scale the final candidates score based on link density. Good content should have a
			 * relatively small link density (5% or less) and be mostly unaffected by this operation.
			**/
			candidates[i].readability.contentScore = candidates[i].readability.contentScore * (1-readability.getLinkDensity(candidates[i]));

			dbg('Candidate: ' + candidates[i] + " (" + candidates[i].className + ":" + candidates[i].id + ") with score " + candidates[i].readability.contentScore);

			if(!topCandidate || candidates[i].readability.contentScore > topCandidate.readability.contentScore)
				topCandidate = candidates[i];
		}

		/**
		 * If we still have no top candidate, just use the body as a last resort.
		 * We also have to copy the body node so it is something we can modify.
		 **/
		if (topCandidate == null || topCandidate.tagName == "BODY")
		{
			/*topCandidate = document_tab.createElement("DIV");
			topCandidate.innerHTML = document_tab.body.innerHTML;
			document_tab.body.innerHTML = "";
      document_tab.body.appendChild(topCandidate);*/
      topCandidate = document_tab.body;
			readability.initializeNode(topCandidate);
		}


		/**
		 * Now that we have the top candidate, look through its siblings for content that might also be related.
		 * Things like preambles, content split by ads that we removed, etc.
		**/
		var articleContent        = document_tab.createElement("DIV");
        articleContent.id     = "readability-content";
		var siblingScoreThreshold = Math.max(10, topCandidate.readability.contentScore * 0.2);
		var siblingNodes          = topCandidate.parentNode.childNodes;
		for(var i=0, il=siblingNodes.length; i < il; i++)
		{
			var siblingNode = siblingNodes[i];
			var append      = false;

			dbg("Looking at sibling node: " + siblingNode + " (" + siblingNode.className + ":" + siblingNode.id + ")" + ((typeof siblingNode.readability != 'undefined') ? (" with score " + siblingNode.readability.contentScore) : ''));
			dbg("Sibling has score " + (siblingNode.readability ? siblingNode.readability.contentScore : 'Unknown'));

			if(siblingNode === topCandidate)
			{
				append = true;
			}
			
			if(typeof siblingNode.readability != 'undefined' && siblingNode.readability.contentScore >= siblingScoreThreshold)
      {
        /*append = true;*/
        topCandidate = topCandidate.parentNode;
			}
			
			if(siblingNode.nodeName == "P") {
				var linkDensity = readability.getLinkDensity(siblingNode);
				var nodeContent = readability.getInnerText(siblingNode);
				var nodeLength  = nodeContent.length;
				
				if(nodeLength > 80 && linkDensity < 0.25)
				{
					//append = true;
          topCandidate = topCandidate.parentNode;
        }
				else if(nodeLength < 80 && linkDensity == 0 && nodeContent.search(/\.( |$)/) !== -1)
				{
          //append = true;
          topCandidate = topCandidate.parentNode;
				}
			}

			if(append)
			{
				dbg("Appending node: " + siblingNode)

				/* Append sibling and subtract from our list because it removes the node when you append to another node */
        /*articleContent.appendChild(siblingNode);*/

				i--;
				il--;
			}
		}				
		
    //return articleContent;
    return topCandidate;
	},
	
	/**
	 * Get the inner text of a node - cross browser compatibly.
	 * This also strips out any excess whitespace to be found.
	 *
	 * @param Element
	 * @return string
	**/
	getInnerText: function (e, normalizeSpaces) {
		var textContent    = "";

		normalizeSpaces = (typeof normalizeSpaces == 'undefined') ? true : normalizeSpaces;

	  textContent = e.textContent.replace( readability.regexps.trimRe, "" );

		if(normalizeSpaces)
			return textContent.replace( readability.regexps.normalizeRe, " ");
		else
			return textContent;
	},

	/**
	 * Get the density of links as a percentage of the content
	 * This is the amount of text that is inside a link divided by the total text in the node.
	 * 
	 * @param Element
	 * @return number (float)
	**/
	getLinkDensity: function (e) {
		var links      = e.getElementsByTagName("a");
		var textLength = readability.getInnerText(e).length;
		var linkLength = 0;
		for(var i=0, il=links.length; i<il;i++)
		{
			linkLength += readability.getInnerText(links[i]).length;
		}		

		return linkLength / textLength;
	},
	
	/**
	 * Get an elements class/id weight. Uses regular expressions to tell if this 
	 * element looks good or bad.
	 *
	 * @param Element
	 * @return number (Integer)
	**/
	getClassWeight: function (e) {
		if(!readability.flagIsActive(readability.FLAG_WEIGHT_CLASSES)) {
			return 0;
		}

		var weight = 0;

		/* Look for a special classname */
		if (e.className != "")
		{
			if(e.className.search(readability.regexps.negativeRe) !== -1)
				weight -= 25;

			if(e.className.search(readability.regexps.positiveRe) !== -1)
				weight += 25;				
		}

		/* Look for a special ID */
		if (typeof(e.id) == 'string' && e.id != "")
		{
			if(e.id.search(readability.regexps.negativeRe) !== -1)
				weight -= 25;

			if(e.id.search(readability.regexps.positiveRe) !== -1)
				weight += 25;				
		}

		return weight;
	},
  flagIsActive: function(flag) {
		return (readability.flags & flag) > 0;
	}, 

 /*
  *******************************************
  * Function to_text                        *
  *  - Removing textual content of script   *
  *  and style elements from the visual     *
  *  Display.                               * 
  *******************************************
  */
  to_text: function(element){
    $("script", element).each(function(count){
      $(this).html("<!--" + $(this).html() + "-->");
    }); 
    $("style", element).each(function(count){
      $(this).html("<!--" + $(this).html() + "-->");
    });
    return $(element).text();
  }
	
};

/*
* Initializing the jetpack Educational Facilita.
*  - Starting jetpack UI modifications for Educational Facilita 
*  - Binding the implemented functions to the jetpack UI elements
*/

jetpack.statusBar.append({
  html: "<button style='background-color:#000000;color:#FFFFFF;text-align:center;padding: 0px 10px'>Educational</button>",  
  onReady: function(widget){
    $(widget).click(function(){
      Educational_Facilita.initialize();
    });    
  }
});
