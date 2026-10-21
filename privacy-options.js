window.googlefc=window.googlefc||{};
window.googlefc.callbackQueue=window.googlefc.callbackQueue||[];
window.googlefc.callbackQueue.push({'CONSENT_API_READY':function(){
 const button=document.getElementById('privacy-options');
 if(!button)return;
 button.hidden=false;
 button.addEventListener('click',function(){
  window.googlefc.callbackQueue.push(function(){window.googlefc.showRevocationMessage();});
 });
}});
