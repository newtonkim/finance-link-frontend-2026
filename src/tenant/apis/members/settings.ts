import { fetchTableData, formDataFormat, scopeValues } from '@/Global';
import { pomPinia } from 'septor-store';
export function memmberSettingApi() {
    const Store = pomPinia();
    function settingsList(data?: object) {
    fetchTableData({
        data: data,
        props: { url: '/settings/member/onboarding/settings-list', state: 'member-onboarding-settings-list' },
        Store,
        saveData: false,
      })
 
    }
    return {
        settingsList
    };
}
