import { getSystemSetting } from "../Helpers";

export default {
  async mounted(el: any, binding: any) {
    const settings = binding.value;

    // No settings required — always show
    if (!settings) return;

    const list = await getSystemSetting();
    const usersettingss =   list?.[settings];
    if (!usersettingss) {
      el.parentNode && el.parentNode.removeChild(el);
    }
  }
}