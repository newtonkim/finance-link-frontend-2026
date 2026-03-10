import { localStoragePicker } from "./Helpers";

export default {
 async mounted(el:any, binding:any) {
    const permission = binding.value;
 const list=await localStoragePicker('userPermissions');
 
 const userPermissions =Array.isArray(list) ? list : JSON.parse(list||'[]');
 
 if(list){
   if(!permission){
  
  }else{
    if (!userPermissions.includes(permission)|| userPermissions?.[permission]) {
      el.parentNode && el.parentNode.removeChild(el);
      return
    }
    
  }
  
  }
  }
}