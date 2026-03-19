import { localStoragePicker } from "../Helpers";

export default {
  async mounted(el: any, binding: any) {
    const permission = binding.value;

    // No permission required — always show
    if (!permission) return;

    const list = await localStoragePicker('userPermissions');
    const userPermissions = Array.isArray(list) ? list : JSON.parse(list || '[]');

    // No permissions configured (e.g. superadmin) — show everything
    console.log(!userPermissions.includes(permission),permission,'userPermissions',userPermissions);
    if (!userPermissions.length) return;
    
    

    if (!userPermissions.includes(permission)) {
      el.parentNode && el.parentNode.removeChild(el);
    }
  }
}