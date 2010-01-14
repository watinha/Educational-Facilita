/*
  ***********************************************************
  *** Jetpack name: Educational Facilita                  ***
  *** Version: 0.1                                        ***
  *** Authors: Willian Massami Watanabe, Arnaldo Candido  ***
  ***          Jr., Marcelo Adriano Amâncio e Matheus de  ***
  ***          Oliveira                                   ***
  ***********************************************************
*/
/*
  Development log:
    - Version 0.1: Readability Module for textual extraction of the site
*/

var Textual_processing = {
  readability_module: function(document_tab){
    /*
    *** Extracted from: http://lab.arc90.com/experiments/readability  ***
    */
    
    var allParagraphs = document_tab.getElementsByTagName("p");
    var topDiv = null;

  	// Replace all doubled-up <BR> tags with <P> tags, and remove fonts.
  	//var pattern =  new RegExp ("<br/?>[ \r\n\s]*<br/?>", "g");
  	//document_tab.body.innerHTML = document_tab.body.innerHTML.replace(pattern, "</p><p>").replace(/<\/?font[^>]*>/g, '');

	  // Grab the title from the <title> tag and inject it as the title.
	  //articleTitle.innerHTML = document_tab.title;
	  //articleContent.appendChild(articleTitle);
	
	  // Study all the paragraphs and find the chunk that has the best score.
	  // A score is determined by things like: Number of <p>'s, commas, special classes, etc.
	  for (var j=0; j	< allParagraphs.length; j++) {
		  parentNode = allParagraphs[j].parentNode;

		  // Initialize readability data
		  if(typeof parentNode.readability == 'undefined')
		  {
			  parentNode.readability = {"contentScore": 0};			

			  // Look for a special classname
			  if(parentNode.className.match(/(comment|meta|footer|footnote)/))
			  	parentNode.readability.contentScore -= 50;
			  else if(parentNode.className.match(/((^|\\s)(post|hentry|entry[-]?(content|text|body)?|article[-]?(content|text|body)?)(\\s|$))/))
				  parentNode.readability.contentScore += 25;

		  	// Look for a special ID
		  	if(parentNode.id.match(/(comment|meta|footer|footnote)/))
		  		parentNode.readability.contentScore -= 50;
		  	else if(parentNode.id.match(/^(post|hentry|entry[-]?(content|text|body)?|article[-]?(content|text|body)?)$/))
		  		parentNode.readability.contentScore += 25;
		  }

		  // Add a point for the paragraph found
		  if(allParagraphs[j].textContent.length > 10)
		  	parentNode.readability.contentScore++;

	  	// Add points for any commas within this paragraph
	  	parentNode.readability.contentScore += allParagraphs[j].textContent.split(",").length;
	  }

	  // Assignment from index for performance. See http://www.peachpit.com/articles/article.aspx?p=31567&seqNum=5 
  	for(nodeIndex = 0; (node = document_tab.getElementsByTagName('*')[nodeIndex]); nodeIndex++)
  		if(typeof node.readability != 'undefined' && (topDiv == null || node.readability.contentScore > topDiv.readability.contentScore))
	  		topDiv = node;
    
    return topDiv;
  }, 
  recover_text: function(element){
    return $(element).text();    
  }
    
};

var Educational_Facilita = {
  version: 0.1,
  initialize: function(){
    var main_element = Textual_processing.readability_module(jetpack.tabs.focused.contentDocument);
    
    // finishes if there is no main element
    if(main_element == null){
      jetpack.notifications.show("Não há texto suficiente para ser transformado nessa página.")
      return 0;
    }
      
    $(jetpack.tabs.focused.contentDocument.body).append(Textual_processing.recover_text(main_element));
  }
};
jetpack.statusBar.append({
  html: "<button style='background-color:#000000;color:#FFFFFF;text-align:center;padding: 0px 10px'>Educational</button>",  
  onReady: function(widget){
    $(widget).click(function(){
      Educational_Facilita.initialize();
    });    
  }
});
