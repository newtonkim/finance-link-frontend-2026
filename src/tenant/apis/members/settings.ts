import { fetchTableData, formDataFormat, scopeValues } from '@/Global';
import { notify } from '@/Global/Toasters';
import { pomPinia } from 'septor-store';

export function memmberSettingApi() {
    const Store = pomPinia();
    function feedback(collection:any,success:string,fail:string) {
             const res: any = Store.stateGenaratorApi(collection);
        let msg: Record<string, string> = {
            msg:success ,
            type: 'Error',
        };
        if (!res || res.status == 200) {
            msg = {
                msg: fail,
                type: 'Success',
            };
        }
        notify(msg);
        return res
    }

    function settingsList(data?: Object) {
      const formDataScoping:any=  formDataFormat(scopeValues(data));
    //     const collection: any = {
    //         reload: 1,
    //         StateStore: 'memberSettingsCreate',
    //         time: 0,
    //         reqs: {
    //             url: '/members/settings-list',
    //             method: 'post',
    //             data:formDataScoping,
    //         },
    //     };
    // }
 
    fetchTableData({
        data: formDataScoping,
        props: { url: '/settings/member/onboarding/settings-list', state: 'memberSettingsCreate' },
        Store,
        saveData: false,
      })
 
    }

    return {
        settingsList
    };
}
