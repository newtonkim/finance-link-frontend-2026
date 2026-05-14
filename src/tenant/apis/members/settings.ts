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
   async function onBoardingProductGeneralCharges(data?: object) {
    const res =await fetchTableData({
        data: data,
        props: { url: '/global/general-product-charges?type=onboarding', state: 'general-product-charges'+data?.id },
        Store,
        saveData: false,
      })
      return res?.payload?.data??[]
 
    }
    return {
        settingsList,
        onBoardingProductGeneralCharges
    };
    };

