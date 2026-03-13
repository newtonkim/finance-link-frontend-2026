import { formDataFormat, scopeValues } from '@/Global';
import { notify } from '@/Global/Toasters';
import { pomPinia } from 'septor-store';

export function plansApi() {
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

    function create(data: any) {
      const formDataScoping:any=  formDataFormat(scopeValues(data));
        const collection: any = {
            reload: 1,
            StateStore: 'plans_list',
            time: 0,
            reqs: {
                url: '/central/settings/plans/create',
                method: 'post',
                data:formDataScoping,
            },
        };
        feedback(collection,"plans created successfully","Failed to create plans")
    }
  
    
    function EraseplansFromUser(data: any) {
        // central/settings/plans/list
        const collection: any = {
            reload: 1,
            StateStore: 'staff-attached-plans',
            time: 0,
            reqs: {
                url: '/central/settings/plans/remove_ability',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
              return feedback(collection,"plans removed"," Failed to remove plans")
    }
     function AttachplansToUser(data: any) {
        const collection: any = {
            reload: 1,
            StateStore: 'staff-attached-plans',
            time: 0,
            reqs: {
                url: '/central/settings/plans/add_ability',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
             return feedback(collection," plans attached "," Failed to attach plans")

    }
   

    return {
        create, EraseplansFromUser,AttachplansToUser
    };
}
