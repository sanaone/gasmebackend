

var str = 
  'New Delivery Request \n' +
  '10777729 *Type:*\n' +
  'Express Delivery *Created by:*\n' +
  '<www.facebook.com/gasme|GasMe Facebook> *When:*\n' +  
  '[Order Time from GasMe] Approve button Reject button' ;
console.log(exgtractOD(str));


function exgtractOD(text) {

    let strval = text.substring(22,text.indexOf("*")).trim();

    return strval;
}