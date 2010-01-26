/*
  ***********************************************************
  *** Jetpack name: Educational Facilita                  ***
  *** Version: 0.4                                        ***
  *** Authors: Willian Massami Watanabe, Arnaldo Candido  ***
  ***          Jr., Marcelo Adriano Amancio, Matheus de   ***
  ***          Oliveira and Jose Augusto Costa Martim     ***
  *** Contact: watinha@gmail.com                          ***
  *** Last changes: 26/01/2010                            ***
  ***********************************************************
*/
/*
  Development log:
    - Version 0.1: Readability Module 0.5 for textual extraction of the site
    - Version 0.2: Separating objects (Educational_Facilita, ui_manager and readability) accordingly to its functionality and inserting the JQuery UI module dinamically on websites.
    - Version 0.2.1: Removing the JQuery UI functionality due to the limitations of the reuse of code of this library and also developing Overlay and Dialog functions to replace the UI components of the JQuery UI.
    - Version 0.3: Inserting Rembrandt functionalities through REST and AJAX. In this version it is expected the delivery of a functional prototype of the application.
    - Version 0.4: Adding the Lexical Elaboration functionality and fixing some issues in the presentation of the informations.
*/
var global_overlay;

var Educational_Facilita = {
  version: "0.3",
  constants: {
    MAIN_ELEMENT_CLASS: "educational_facilita_main"
  },
  initialize: function(){
    var document_current_tab = jetpack.tabs.focused.contentDocument;
    global_overlay = new Loading_dialog(document_current_tab);

    try{
      var main_element;
      if ($("." + this.constants.MAIN_ELEMENT_CLASS, document_current_tab).size() == 0){
        main_element = readability.grabArticle(document_current_tab);
        $(main_element).addClass(this.constants.MAIN_ELEMENT_CLASS);
      }else
        main_element = $("." + this.constants.MAIN_ELEMENT_CLASS, document_current_tab).get(0); 

      // finishes if there is no main element
      if(main_element == null){
        jetpack.notifications.show("N");
        return 0;
      }
      //jetpack.notifications.show(readability.to_text(main_element));
      //global_overlay = new Dialog($(document_current_tab.createElement("div")).css({padding: "15px"}).append(readability.to_text(main_element)), document_current_tab, "readability result", {height: "90%", width: "90%", top: "5%", left: "5%"});
      Rembrandt_service.call_rembrandt(readability.to_text(main_element), document_current_tab);
      //Textual_elaboration_service.call_lexical_elaboration(readability.to_text(main_element), document_current_tab);
    }catch(e){
      //jetpack.notifications.show("Problemas 2 :: " + e);
    }
  }

};

/**
  * Rembrandt_service object
  *  - This object is responsible by the remote call through
  *  REST to the Rembrandt server.
  */
var Rembrandt_service = {
  constants: {
    REMBRANDT_URL: "http://nilc.icmc.usp.br/porsimples/facilita/entidades.php",
    REMBRANDT_LINKS_ID: "rembrandt_link_",
    REMBRANDT_LINKS_CLASS: "rembrandt_link",
    REMBRANDT_LINKS_DATA: "rembrandt_data"
  },

  regexps: {
    REMOVE_SEGMENTS_ENTITIES: /\{|\}|\[|\]/g,
    BEGGINING_BODY: "<BODY>",
    END_BODY: "</BODY>"
  },

  call_rembrandt: function(text, document_current_tab){
    var request = $.ajax({
      type: "POST", 
      data: ({texto: text}),
      url: this.constants.REMBRANDT_URL,
      error: function(XMLHttpRequest, textStatus){
        Error_dialog(document_current_tab);
      },
      success: function(response){

        // Calling the Textual_elaboration_service  
        Textual_elaboration_service.call_lexical_elaboration(text, document_current_tab);

        if (!Rembrandt_service.check_consistency(text, response)){
          global_overlay = new Error_dialog(document_current_tab);
          return ;
        }
        var response_div = document_current_tab.createElement("div");
        $(response_div).css({
          padding: "10px",
          overflow: "auto" 
        });

        //global_overlay.close();

        response = Rembrandt_service.rembrandt_to_HTML(response, document_current_tab);

        try{
          HTML_handler.merge_htmls(response, document_current_tab);
        }catch(ex){
          //jetpack.notifications.show("Erro 1 :: " + ex);
        }

        //$(response_div).append(response);
        //global_overlay = new Dialog(response_div, document_current_tab, "Rembrandt Response", {height: "90%", width: "90%", left: "5%", top: "5%"});
        

      }
    });
  },

  check_consistency: function(entry_text, rembrandt_text){
    return (entry_text.length<rembrandt_text.length?true:false);
  },
  
  rembrandt_to_HTML: function(rembrandt_out, current_document){
    var div = jetpack.tabs.focused.contentDocument.createElement("div");
    rembrandt_out = rembrandt_out.replace("UTF-8", " ");
    $(div).html(rembrandt_out.replace(this.regexps.REMOVE_SEGMENTS_ENTITIES, " "));
    $(div).find("EM").each(function(count){
      var rembrandt_link = jetpack.tabs.focused.contentDocument.createElement("a");
      $(rembrandt_link).attr({
        id: (Rembrandt_service.constants.REMBRANDT_LINKS_ID + count),
        class: (Rembrandt_service.constants.REMBRANDT_LINKS_CLASS),
        href: "#"
      });
      $(rembrandt_link).css({
        backgroundColor: "#FFAA66",
        color: "#000000", 
        fontSize: "1em"
      });
      $(rembrandt_link).data(Rembrandt_service.constants.REMBRANDT_LINKS_DATA ,{
        ID: ($(this).attr("ID")),
        S: ($(this).attr("S")),
        T: ($(this).attr("T")),
        C1: ($(this).attr("C1")),
        C2: ($(this).attr("C2")),
        C: ($(this).attr("C")),
        WK: ($(this).attr("WK")),
        TG: ($(this).attr("TG"))
      });
      $(rembrandt_link).html($(this).html());
      $(rembrandt_link).click(function(){

        if (global_overlay)
          global_overlay.close();

        var container_div = jetpack.tabs.focused.contentDocument.createElement("div");
        $(container_div).css({
          padding: "15px"
        });
        
        if ($(this).data(Rembrandt_service.constants.REMBRANDT_LINKS_DATA).WK){
          var div_wiki = jetpack.tabs.focused.contentDocument.createElement("div");
          $(div_wiki).css({
            overflow: "auto",
            height: "100%",
            position: "absolute",
            top: "0"
          });
          $(div_wiki).html("Aguarde, carregando dados da Wikipedia...").appendTo(container_div);
          var loading_overlay = jetpack.tabs.focused.contentDocument.createElement("img");
          $(loading_overlay).attr({
            id: "loading_overlay",
            alt: "Carregando",
            src: "http://vinho.intermidia.icmc.usp.br/watinha/Educational-Facilita/loading3.gif"
          });
          $(div_wiki).append(loading_overlay);
          global_overlay = new Dialog(container_div, current_document, $(this).text(), {height: "70%", width: "70%", top: "15%", left: "15%"});
          Wikipedia_service.get_main_content($(this).data(Rembrandt_service.constants.REMBRANDT_LINKS_DATA).WK, div_wiki);
        }else{
          if (global_overlay && global_overlay.overlay_div && $($("p", global_overlay.overlay_div).get(0)).text() == $(this).data(Rembrandt_service.constants.REMBRANDT_LINKS_DATA).C){
            global_overlay.close();
            global_overlay = false;
            return false;
          }
          var p_desc = jetpack.tabs.focused.contentDocument.createElement("p");
          $(p_desc).text($(this).data(Rembrandt_service.constants.REMBRANDT_LINKS_DATA).C).appendTo(container_div).css({
            fontSize: "1.5em"
          });
          global_overlay = new Tooltip(container_div, current_document, this);
        }
        
        return false;
      });
      $(this).replaceWith(rembrandt_link);
    });

    return div;
  }
};

/**
  * Wikipedia_service Object  
  *  - A simple way of retrieving any relevant data that 
  *  describes an entity
  */

var Wikipedia_service = {
  constants: {
    WIKIPEDIA_URL: "http://pt.wikipedia.org/wiki/",
    MAIN_CONTENT_ID: "bodyContent"
  }, 
  get_main_content: function(entity, update_element){
  
    $.ajax({
      type: "GET",
      url: (Wikipedia_service.constants.WIKIPEDIA_URL + entity),
      success: function (data, textStatus, XMLHttpRequest){
        var wiki_element = jetpack.tabs.focused.contentDocument.createElement("div");
        wiki_element.innerHTML = data;
        var paragraphs = $("#" + Wikipedia_service.constants.MAIN_CONTENT_ID, wiki_element);
        $(update_element).html(paragraphs);
        //var description_paragraph;
        //for (var cont_par = 0; cont_par < paragraphs.size(); cont_par++){
        //  if (paragraphs.get(cont_par).childNodes[0].nodeType == 3){
        //    $(update_element).html(paragraphs.get(cont_par));
        //    return ;
        //  }
        //}  
      }
    });

    return "wikipedia"
  }
};

/**
  * Textual_elaboration_service object
  *  - This object will interface each and every requests that
  *  are to be made to the Textual elaboration methods implemented.
  */
var Textual_elaboration_service = {
  constants: {
    LEXICAL_ELABORATION_URL: "http://www.nilc.icmc.usp.br/~matheus/simplifica2/simplificador_lexico",
    SINONIMOUS_URL: "http://www.nilc.icmc.usp.br/~matheus/simplifica2",
    ERROR_SINONIMOUS: "NotFound!"
  },
  call_lexical_elaboration: function(text, document_current_tab){
    var request = $.ajax({
      type: "POST", 
      data: ({texto: text}),
      url: this.constants.LEXICAL_ELABORATION_URL,
      error: function(XMLHttpRequest, textStatus){
        Error_dialog(document_current_tab);
      },
      success: function(response){
      
        global_overlay.close();
        
        var div_lexical = jetpack.tabs.focused.contentDocument.createElement("div");
        $(div_lexical).html(response).css({padding: "15px"});

        //global_overlay = new Dialog(div_lexical, document_current_tab, "Lexical Test", {height: "90%", width: "90%", top: "5%", left: "5%"});
        div_lexical = Textual_elaboration_service.format_to_html(div_lexical, document_current_tab);

        try{
          HTML_handler.merge_htmls(div_lexical, document_current_tab);
        }catch(ex){
          jetpack.notifications.show("terminando com erro" + ex);
        }

        var current_tab;
        for(i in jetpack.tabs){
          if(jetpack.tabs[i].contentDocument == document_current_tab)
            current_tab = i;
        }
        if (current_tab && jetpack.tabs.focused != jetpack.tabs[current_tab]) 
          jetpack.tabs[current_tab].raw.style.cssText = "-moz-apperance: none !important; color: #000000; background-color: rgb(255, 150, 0); border: 1px solid #000 !important;";
        jetpack.notifications.show("O Facilita Educacional concluiu suas atividades na aba: " + document_current_tab.title);
      }
    });
 
  },
  format_to_html: function(div_text, document_current_tab){
   $("a", div_text).css({
    backgroundColor: "#FFDDBB"
   }).each(function(count){
    $(this).click(function(){
      var container_div = jetpack.tabs.focused.contentDocument.createElement("div");
      $(container_div).css({
        padding: "15px"
      });
  
      var data_span = jetpack.tabs.focused.contentDocument.createElement("span");
      $(data_span).attr({id: "lexical_tooltip"}).css({display: "none"}).html($(this).text()).appendTo(container_div);

      var sinonimous_div = jetpack.tabs.focused.contentDocument.createElement("div");
      $(sinonimous_div).html("Aguarde, carregando os sin&ocirc;nimos...").appendTo(container_div);
      var loading_overlay = jetpack.tabs.focused.contentDocument.createElement("img");
      $(loading_overlay).attr({
        id: "loading_overlay",
        alt: "Carregando",
        src: "http://vinho.intermidia.icmc.usp.br/watinha/Educational-Facilita/loading3.gif"
      });
      $(sinonimous_div).append(loading_overlay);

      if (global_overlay && global_overlay.overlay_div && $(this).text() == $("#lexical_tooltip", global_overlay.overlay_div).text()){
        global_overlay.close();
        global_overlay = false;
        return false;
      } 
      
      global_overlay = new Tooltip(container_div, document_current_tab, this);

      var count_ajax = 0;
      $.ajax({
        type: "GET", 
        url: (Textual_elaboration_service.constants.SINONIMOUS_URL + $(this).attr("href").substring(1)),
        error: function(XMLHttpRequest, textStatus){
          Error_dialog(document_current_tab);
        },
        success: function(response){
          if (response.search(Textual_elaboration_service.constants.ERROR_SINONIMOUS) != -1)
            response = "<h3>Tente novamente...</h3>";
          
          $(sinonimous_div).html(response);
        }
      });
      return false;
    });
   });

   return div_text;
  }
};

/**
  * HTML_handler
  *  - This object will execute integration of textual marked annotations
  *  and the HTML of the page itself. It will receive the responses of services
  *  and turn them into HTML dialog elements for the presentation.
  */
var HTML_handler = {
  constants: {},
  merge_htmls: function(html, current_document){
    var main_element = $("." + Educational_Facilita.constants.MAIN_ELEMENT_CLASS, current_document);
    var entity_names = $("a", html); //." + (Rembrandt_service.constants.REMBRANDT_LINKS_CLASS), html);
    var cont_entity = 0;

    var entity_not_found = [];
    var last_node_found;

    /*
      Looking for elements inside the main element
    */
    for (var nodeIndex = 0; ((node = main_element.get(0).getElementsByTagName('*')[nodeIndex]) && cont_entity <= entity_names.size()); nodeIndex++){
      /*
        Looking for text nodes to find the expression to be remarked
      */
      if (node.nodeName != "SCRIPT" && node.nodeName != "STYLE"){
        for (var child_index = 0; child_index < node.childNodes.length; child_index++){
          if (node.childNodes[child_index].nodeType == 3){
            var node_text = node.childNodes[child_index].nodeValue;
            var expression = $(entity_names.get(cont_entity)).text().replace(/\s+/g, " ").replace(/^\s+|\s+$/g,"");
            var regular = new RegExp ( "^" + expression + "$|^" + expression + "\\W|\\W" + expression + "\\W|\\W" + expression + "$");
            if (node_text.replace(/\s+/g, " ").search(regular) > -1){
              if (node.nodeName == "A"){
                if(!$(node).hasClass(Rembrandt_service.constants.REMBRANDT_LINKS_CLASS))
                  cont_entity++;
                if (cont_entity == entity_names.size()){
                  for (var cont_not_found = 0; cont_not_found < entity_not_found.length; cont_not_found++)
                    $(current_document.body).append("<h1>" + entity_names.get(entity_not_found[cont_not_found]).innerHTML.replace(/^\s+|\s+$/g, "") + "</h1>");
                  return ;
                }
              }else{
                entity_str_index = node_text.replace(/\s+/g, " ").search(regular);
                var begin_text = current_document.createTextNode(node_text.replace(/\s+/g, " ").substring(0, entity_str_index));
                var end_text = current_document.createTextNode(node_text.replace(/\s+/g, " ").substring(entity_str_index + $(entity_names.get(cont_entity)).text().replace(/\s+/g, " ").replace(/^\s+|\s+$/g,"").length + 1, node_text.replace(/\s+/g, " ").length));

                node.childNodes[child_index].parentNode.replaceChild(end_text, node.childNodes[child_index]);
                end_text.parentNode.insertBefore(begin_text, end_text);
                end_text.parentNode.insertBefore(entity_names[cont_entity], end_text);

                entity_names[cont_entity].innerHTML = " " + entity_names[cont_entity].innerHTML + " ";

                cont_entity++; // keeping an eye for the remaining named entities
                if(cont_entity == entity_names.size()){
                  for (var cont_not_found = 0; cont_not_found < entity_not_found.length; cont_not_found++)
                    $(current_document.body).append("<h1>" + entity_names.get(entity_not_found[cont_not_found]).innerHTML.replace(/^\s+|\s+$/g,"") + "</h1>");
                  return ;
                }
              }
              last_node_found = nodeIndex;
            }//if 
          }// if
        }// text nodes
      } // IF
      if ((!(node = main_element.get(0).getElementsByTagName('*')[nodeIndex + 1])) && cont_entity < entity_names.size()){
        entity_not_found.push(cont_entity++);
        nodeIndex = last_node_found - 1;
      }  
    }// all elements in the main element
    for (var cont_not_found = 0; cont_not_found < entity_not_found.length; cont_not_found++)
      $(current_document.body).append("<h1>" + entity_names.get(entity_not_found[cont_not_found]).innerHTML.replace(/^\s+|\s+$/g,"") + "</h1>");
  }
};

/**
  * Overlay Object.
  *  - Inserts an overlay on the page in order to present 
  *  unpreventable content to the user.
  *  - Requires Jquery library.
  *  
  *  @params DIVElement and HashMap with the options
  **/
function Overlay (main_element, document_tab, options){
}
Overlay.prototype.constants = {
  OVERLAY_ID: "overlay_id"
};
Overlay.prototype.initialize = function(main_element, document_tab, options){
  options = options || {};
  this.document_tab = document_tab;
  /*
    option modal disables the background of the overlay in a way that the user
    is required to interact with the overlay before going back to the page itself.
  */
  if (!options["modal"])
    options["modal"] = "true";
  /*
    Option height used to define the height of the overlay box to be presented.
  */
  if (!options["height"])
    options["height"] = "50%";
  /*
    Option width to determine the width of the overlay box to be presented.
  */
  if (!options["width"])
    options["width"] = "50%";

  /*
    Option TOP to determine the position of the element
  */
  if (!options["top"])
    options["top"] = "15%";

  /*
    Option LEFT to determine the position of the element
  */
  if (!options["left"])
    options["left"] = "25%";

  /*
    Option POSITION to determine the kind of positioning of the overlay
  */
  if (!options["position"])
    options["position"] = "fixed";
    
  if (options["modal"] == "true"){
    this.modal_div = this.document_tab.createElement("div");
    $(this.modal_div).css({
      width: "100%",
      height: "100%",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 99998,
      opacity: 0.6,
      backgroundColor: "#000000"
    });
  }
    
  this.overlay_div = this.document_tab.createElement("div");
  $(this.overlay_div).css({
    width: options["width"],
    height: options["height"],
    position: options["position"],
    top: options["top"],
    left: options["left"],
    zIndex: 99999,
    opacity: 0.9,
    backgroundColor: "#FFFFFF",
    MozBorderRadius: "10px"
  });
  $(this.overlay_div).append(main_element);

  this.container = this.document_tab.createElement("div");
  $(this.container).attr({
    id: this.constants.OVERLAY_ID
  });
  $(this.container).append(this.overlay_div);

  if(this.modal_div)
    $(this.container).append(this.modal_div);

  this.open();
}
Overlay.prototype.open = function(){
  /*
   * Verify if there is another current active overlay on the page
   */
  var active_overlay = $("#" + this.constants.OVERLAY_ID, this.document_tab);
  if(active_overlay.size() != 0){
    active_overlay.fadeOut(500, function(){
      $(this).remove();
    });
  }

  $(this.document_tab.body).append(this.container);

  /*
   * Generating the animation of the overlay opening
   */
  var overlay_height = $(this.overlay_div).css("height");

  $(this.container).css({opacity: 0});
  $(this.overlay_div).css({height: "0", opacity: 0});
  
  $(this.container).fadeTo(500, 1, function(){
    $(this.childNodes[0]).animate({
      height: overlay_height,
      opacity: 1
    }, 500);
  });
}
Overlay.prototype.close = function(){
  $(this.container).fadeTo(500, 0, function(){
    $(this).remove(); 
  });
}
/**
  * Tooltip Object  
  *  - Inserts a Tooltip right next to a specified element
  *  reusing the overlay implementation
  */
function Tooltip(main_element, document_tab, activation_element){
  this.initialize(main_element, document_tab, {height: "100%", width: "100%", top: " ", left: " ", position: "inherit", modal: "false"});
  $(this.overlay_div).css({
    MozBoxShadow: "10px 10px 5px #666",
    borderTop: "solid 10px #FF9900",
    borderBottom: "solid 10px #AAAAAA",
    position: "relative",
    borderLeft: "solid 3px #FFCC99",
    borderRight: "solid 3px #FFCC99",
    top: ($(activation_element).height() + 3 + "px"),
    right: ($(activation_element).width() + "px"),
    overflow: "hidden"
  });
  $(this.container).css({
    display: "inline",
    position: "absolute"
  }).remove().insertAfter(activation_element);
}
Tooltip.prototype = new Overlay;
/**
  * Dialog Object.
  *  - Inserts a Dialog in the page which is quite similar 
  *  to the Overlay with the difference that it can be closed
  *  at any time by the user.
  **/
function Dialog(main_element, document_tab, title, options){
  this.initialize(main_element, document_tab, options);
  this.insert_dialog_bar(title);
}
Dialog.prototype = new Overlay;
Dialog.prototype.insert_dialog_bar = function(title){
  this.dialog_bar_div = this.document_tab.createElement("div");
  $(this.dialog_bar_div).css({
    width: "100%",
    position: "absolute",
    bottom: 0,
    backgroundColor: "#DDDDDD",
    padding: "10px 0",
    fontFamily: "Arial"
  });
  
  this.dialog_title = this.document_tab.createElement("h2");
  this.dialog_title.innerHTML = title;
  $(this.dialog_title).css({
    textAlign: "left",
    color: "#555555",
    display: "inline",
    fontWeight: "normal",
    position: "relative",
    left: "10px",
    fontFamily: "Arial"
  });

  this.close_link = this.document_tab.createElement("a");
  this.close_link.innerHTML = "Voltar ao Site";
  $(this.close_link).attr({
    href: "#"
  });
  $(this.close_link).css({
    float: "right",
    fontSize: "2em",
    position: "relative",
    right: "10px",
    textDecoration: "none",
    color: "#000000"
  });
  $(this.close_link).hover(function(){
    $(this).css({color: "#666666"});
  }, function(){
    $(this).css({color: "#000000"});
  });
  var document_tab = this.document_tab;
  $(this.close_link).click(function(){
    $("#overlay_id", document_tab).fadeOut(1000, function(){
      $(this).remove();
    });
    return false;
  });

  /**
    * Adding some colors to the overlay border
    */
  $(this.overlay_div).css({
    borderTop: "solid 10px #FF9900",
  });

  $(this.dialog_bar_div).append(this.dialog_title);
  $(this.dialog_bar_div).append(this.close_link);
  $(this.overlay_div).append(this.dialog_bar_div);
}

/**
  * Loading_dialog object
  *  - A simple way to implement the initial loading overlay of
  *  Educational Facilita, while the first textual processing 
  *  operations havent finished yet.
  */
function Loading_dialog(document_tab){
  var loading_overlay = document_tab.createElement("img");
  $(loading_overlay).attr({
    id: "loading_overlay",
    alt: "Carregando",
    src: "http://vinho.intermidia.icmc.usp.br/watinha/Educational-Facilita/loading3.gif"
  });

  $(loading_overlay).wrap("<div style='position:absolute;top:40%;width:100%;text-align:center'></div>").after("<h2 style='font-size: 300%'>Aguarde...</h2>");
  
  this.initialize($(loading_overlay).parent(), document_tab);

  $(this.overlay_div).css({
    MozBoxShadow: "10px 10px 5px #333",
    borderTop: "solid 10px #FF9900",
    borderBottom: "solid 10px #AAAAAA"
  });
}
Loading_dialog.prototype = new Overlay;

/**
  * Error_dialog function
  *  - A simplistic way for reusing a error standard message
  *
  */

function Error_dialog(document_tab){

  var error_img = document_tab.createElement("img");
  $(error_img).attr({
    id: "error_img",
    alt: "Ocorreu um erro na chamada",
    src: "http://vinho.intermidia.icmc.usp.br/watinha/Educational-Facilita/disconnect.png"
  });

  $(error_img).wrap("<div style='position:absolute;top:40%;width:100%;text-align:center'></div>").after("<h2 style='font-size: 1.5em'>Ocorreu um erro de processamento no Facilita Educativo. Tente novamente...</h2>");
        
  global_overlay = new Dialog($(error_img).parent(), document_tab, "Erro na opera&ccedil;&atilde;o", {height: "60%", width: "60%", left: "20%", top: "20%"});

  var current_tab;

  for(i in jetpack.tabs){
    if(jetpack.tabs[i].contentDocument == document_tab)
      current_tab = i;
  }
  jetpack.tabs[current_tab].raw.style.cssText = "-moz-apperance: none !important; color: #000000; background-color: rgb(255, 50, 50); border: 1px solid #000 !important;";
  jetpack.notifications.show("Ocorreu um erro no processamento do Facilita Educativo");
}

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

    var text_content = "";
    var elements = element.getElementsByTagName("*");
    /*
      Getting through all the elements above ELEMENT PARAM
    */
    for (var cont_elements = 0; cont_elements < elements.length; cont_elements++){
      if (elements[cont_elements].nodeName != "SCRIPT" && elements[cont_elements].nodeName != "STYLE"){
        var childs = elements[cont_elements].childNodes;
        /*
          Getting through all child elements and looking for text nodes
        */
        for (var cont_childs = 0; cont_childs < childs.length; cont_childs++){
          if(childs[cont_childs].nodeType == 3)
            text_content += " " + childs[cont_childs].nodeValue;
        } // FOR
      } // IF
    } // FOR 
    return text_content;
  } 
	
};

/*
* Initializing the jetpack Educational Facilita.
*  - Starting jetpack UI modifications for Educational Facilita 
*  - Binding the implemented functions to the jetpack UI elements
*/

jetpack.statusBar.append({
html: "<span style='background-color:#EE9911;color:#FFFFFF;padding:0 15px;cursor: pointer;'> Educational</span>",
  onReady: function(widget){
    $(widget).click(function(){
      Educational_Facilita.initialize();
    });    
  }
});
jetpack.tabs.onFocus(function(){
  this.raw.style.cssText = "";
}); 
