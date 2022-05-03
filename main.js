/* init -------------------------------------------*/
window.onload=function(){
  form.in.value = "";
  loadlink();
  makelink();
};
/* permanent link ---------------------------------*/
var loadlink=function(){
  var query=location.search.substr(1);
  if(query.length>0){
    //get matrix
    var str = query.match(/(h=)(.*$)/)[2];
    str=str.replace(/\./g, " ");
    str=str.replace(/;/g, "\n");
    str=str.replace(/_/g, "");
    form.in.value=str;
  }
}
var makelink=function(){
  var query="h=";
  var str=form.in.value;
  str=str.replace(/\n/g, ";");
  str=str.replace(/\s/g, ".");
  query+=str+"_";
  var url = location.origin+location.pathname+"?"+query;
  document.getElementById("link").href = url;
  document.title=str;
  return url;
}
var prevurl="";
var autosave=function(){
  if(autosavecheck.value){
    var url = makelink();
    if(prevurl!=url){
      history.pushState(null,null,url);
    }
    prevurl=url;
  }
}
var lastcommand=function(){/* nop */};
var redraw=function(){
  lastcommand();
}
/* clear ---------------------------------*/
var doclear=function(){
  form.in.value ="";
  form.out.value="";
  var url=makelink();
  if(url.match(/^https:\/\//) || url.match(/^http:\/\//)){
    url=url.replace(/\/[^\/]*$/,"/");
  }else{
    url=url.replace(/\/[^\/]*$/,"/index.html");
  }
  history.pushState(null,null,url);
}
/** doparse()
  * @brief parse form.in and output result into form.out.
  * @details This function is called by clicking "parse" button.
*/
var doparse=function(){
  var code = [];

  var stt_new = 0;
  var stt_var = 1;
  var stt_ctl = 2;

  var stt;
  var stt_prev = stt_new;
  var tok="";
  var strin=form.in.value;
  for(var i=0;i<strin.length;i++){
    var c=strin[i];
    if(c.match(/[a-zA-Z0-9_.]/) stt = stt_var;
    if(c.match(/[=<>+-*/^|&:]/) stt = stt_ctl;
    if(c='\n'                 ) stt = stt_ctl;
    var skip  = function(){};
    var open  = function(){tok =c;};
    var cont  = function(){tok+=c;};
    var close = function(){code.push(tok);};
    var clop  = function(){open();close();};
    var func=[
   /* [new  , var  , ctl ] = next */
      [skip , open , open], /* new */
      [close, cont , clop], /* var */
      [close, clop , cont]  /* ctl */
    ];                      /* = prev */
    func[stt_prev, stt]();
  }
  code.push(tok);
  lastcommand=doparse;
  autosave();
};

