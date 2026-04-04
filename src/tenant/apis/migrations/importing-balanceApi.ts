import { fetchTableData,  } from '@/Global';
import { pomPinia } from 'septor-store';
export function importDataApi() {
    const Store = pomPinia();
    function List(data?: object) {
    fetchTableData({
        data: data,
        props: { url: '/members/opening-balance-member-import', state: 'member-onboarding-settings-list' },
        Store,
        saveData: false,
      })
 
    }
    function sendOpeningimportDataToBackend(data?: object) {
   return fetchTableData({
        data: {rows:data},
        props: { url: '/members/download-members-import-template/import-opening-balance', state: 'import-opening-balance' },
        Store,
        saveData: false,
      })
 
    }
    return {sendOpeningimportDataToBackend,
        List
    };
}
