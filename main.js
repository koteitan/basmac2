/** window.onload()
  * @brief initialize window.
  * @details This function is called by loading the window.
*/
window.onload=function(){
  form.in.value = "";
  loadlink();
  makelink();
};
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
  //input
  var mstr=form.in.value;
  //split
  var ystr=mstr.split("\n");
  
  form.out.value="";
  for(var y=0;y<ystr.length;y++){
    //trim
    var str=ystr[y].replace(/\s\s*/g, " ");
    str=str.replace(/^\s*/g, "");
    str=str.replace(/\s*$/g, "");
    if(str!=""){
      var xstr=str.split(" ");
      for(var x=0;x<xstr.length;x++){
        str=xstr[x];
        if(str!=""){
          //parse
          var h=Hydra.parse(str);
          //out string expression
          form.out.value+=h.toString();
          //out tree expression
        }
        form.out.value+="  ";
      }//x
    }
    form.out.value+="\n";
  }//y
  lastcommand=doparse;
  autosave();
};

/** expand()
  * @brief expand form.in X Y and output result X[Y] into form.out.
  * @details This function is called by clicking "expand" button.
*/
var doexpand=function(isdetail){
  var line=form.in.value.split("\n");
  form.out.value="";
  for(var i=0;i<line.length;i++){
    var h=Hydra.parse(line[i]);
    var t=parseInt(form.bracket.value);
    var e=h.expand(t,isdetail);
    form.out.value+=e.toString()+"\n";
  }
  lastcommand=doexpand;
  autosave();
}
var doexpandlast=function(isdetail){
  form.in.value=form.in.value.replace(/\n\n*/g,"\n");
  form.in.value=form.in.value.replace(/\n$/g,"");
  var line=form.in.value.split("\n");
  var h=Hydra.parse(line[line.length-1]);
  var t=parseInt(form.bracket.value);
  form.out.value = "";
  var e=h.expand(t, isdetail);
  form.in .value += "\n"+e.toString();
  form.out.value += e.toString();
  form.in.scrollTop = form.in.scrollHeight;
  autosave();
}

Hydra = function(input){
  if(input instanceof Array){
    this.a = input.clone();
  }else if(typeof input === "string" || input instanceof String){
    this.a = Hydra.parse(input).a;
  }
}
Hydra.parse = function(str){
  var a=[];
  var label=0;
  var level=0;
  var parenstack=[];
  var pre; /* previous char */
  for(var i=0;i<str.length;i++){
    var c=str[i];
    if(c>='0'&&c<'9'){
      label=label*10+parseInt(c)
      c="digit";
    }else{
      switch(c){
        case '(':
          parenstack.push(level);
          if(pre=="digit"){
            a.push([level,label]);
            label=0;
          }
          if(pre!='^')level++;
          break;
        case '^':
          if(pre=="digit"){
            a.push([level,label]);
            label=0;
          }
          level++;
          break;
        case ')':
          if(pre=="digit"){
            a.push([level,label]);
            label=0;
          }
          level=parenstack.pop();
          break;
        case '+':
        case ',':
          if(pre=="digit"){
            a.push([level,label]);
            label=0;
          }
          level=parenstack.pop();
          parenstack.push(level);
          break;
        default:
          break;
      }//switch
    }//if
    pre=c;
  }//for i
  if(pre=="digit")a.push([level,label]); 
  return new Hydra(a);
}
/* this.toString()=string representation of this */
/* this.toString(x)=string representation of partial hydra starting by x */
Hydra.prototype.toString=function(x){
  if(x==undefined){
    return this.toString(0);
  }else{
    var ret="";
    var a=this.a;
    var xs=a.length;
    if(a.length==0)return "";
    ret+=a[x][1];
    var c=this.children(x);
    if(c.length==0)return ret;
    ret+="^";
    if(c.length>1)ret+="(";
    for(var ci=0;ci<c.length;ci++){
      if(ci!=0)ret+="+";
      ret+=this.toString(c[ci]);
    }
    if(c.length>1)ret+=")";
    return ret;
  }
}
/* this.lettersbefore(x)=count letter before string representation of this */
Hydra.prototype.lettersbefore=function(x,x0){
  if(x==undefined){
    return -this.toString.length;
  }else if(x0==undefined){
    return -this.lettersbefore(x,0);
  }else{
    if(x==x0) return 0;
    
    var ret=0;
    var a=this.a;
    var xs=a.length;
    if(a.length==0)return 0;
    ret+=(a[x0][1]+"").length;
    var c=this.children(x0);
    if(c.length==0)return ret;
    ret+=1;
    if(c.length>1)ret+=1;
    for(var ci=0;ci<c.length;ci++){
      if(ci!=0)ret+=1;
      childletters = this.lettersbefore(x,c[ci]);
      if(childletters<=0){
        ret = -ret+childletters;
        return ret;
      }
      ret+=childletters;
    }
    if(c.length>1)ret+=1;
    return ret;
  }
}
/* getchildlen(p)=children indices array of the node at p-th column */
Hydra.prototype.children=function(p){
  var c=[];
  for(var x=p+1;x<this.a.length;x++)
    if(this.parent(x)==p)
      c.push(x);
  return c;
}
/* parent(c) = parent index of c */
Hydra.prototype.parent=function(c){
  var a=this.a;
  for(var x=c-1;x>=0;x--)
    if(a[x][0]<a[c][0])return x;
  return -1;
}
Hydra.prototype.eq=function(hb){
  var a=this.a;
  var b=hb.a;
  for(var x=0;true;x++){
    if(x==a.length && x==b.length)return true;
    if(x==a.length || x==b.length)return false;
    if(a[x][0]!=b[x][0] || a[x][1]!=b[x][1]) return false;
  }
}
Hydra.prototype.lt=function(hb){
  var a=this.a;
  var b=hb.a;
  for(x=0;true;x++){
    if(x==a.length && x==b.length)return false;
    if(x==a.length)return true;
    if(x==b.length)return false;
    if(a[x][0]<b[x][0])return true;
    if(a[x][0]>b[x][0])return false;
    if(a[x][1]<b[x][1])return true;
    if(a[x][1]>b[x][1])return false;
  }
  return false;
}
Hydra.prototype.leq=function(hb){
  return this.eq(hb) || this.lt(hb);
}

Hydra.prototype.gt=function(hb){
  return !this.leq(hb);
}
Hydra.prototype.geq=function(hb){
  return !this.lt(hb);
}
Hydra.prototype.expand=function(n, isdetail){
  if(isdetail==undefined)isdetail=false;

  if(isdetail){
    form.out.value += this.toString()+"\n";
  }

  var a=this.a;
  var len=a.length;
  if(len==0) return new Hydra([]);

  var r;
  for(r=this.parent(len-1);r>0;r=this.parent(r)){
    Fc=this.family(len-1);
    Fr=this.family(r);
    if(Fr.lt(Fc))break;
  }
  if(isdetail){
    form.out.value += " ".repeat(this.lettersbefore(r));
    form.out.value += "R\n";
  }
  
  var D=this.degrade();
  if(isdetail){
    form.out.value += "D[0]=" + D[0] + "\n";
    form.out.value += "D[1]=" + D[1] + "\n";
  }
  if(D.length==0 || r==-1){
    a=a.clone();
    a.pop();
    return new Hydra(a);
  }

  var delta = D[0]-a[r][0];
  var G=a.slice(0,r);
  var S=[].concat(G);
  for(k=0;k<=n;k++){
    var B=[];
    for(x=0;x<len-1-r;x++){
      if(k>0 && x==0){
        B.push([this.a[r+x][0]+k*delta, D[1]]);
      }else{
        B.push([this.a[r+x][0]+k*delta, this.a[r+x][1]]);
      }
    }
    S=S.concat(B);
  }
  return new Hydra(S);
}
Hydra.prototype.family=function(r){
  var a=[];
  for(x=r;x<this.a.length;x++){
    a.push([this.a[x][0]-this.a[r][0],this.a[x][1]]);
  }
  return new Hydra(a);
}
Hydra.prototype.degrade=function(){
  var a=this.a;
  var len=a.length;
  if(a[len-1][0]==0)return [];

  var D=a[len-1].clone();

  if(D[1]>0){
    D[1]--;
  }else{
    var p=this.parent(len-1);
    while(p>=0 && a[p][0]>0 && a[p][1]==0)p=this.parent(p);
    if(p<0||a[p][0]==0)return [];
    D[0]=a[p][0];
    D[1]=a[p][1]-1;
  }
  return D;
}
