import { formDataFormat, scopeValues } from '@/Global';
import { notify } from '@/Global/Toasters';
import { pomPinia } from 'septor-store';

export function members2Api() {
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
            StateStore: 'createpemissions',
            time: 0,
            reqs: {
                url: 'central/Permisions/pemissions',
                method: 'post',
                data:formDataScoping,
            },
        };
        feedback(collection,"pemissions created successfully","Failed to create pemissions")
    }
  
   
    function Erase(data: any) {
        const collection: any = {
            reload: 1,
            StateStore: 'fetchPositions',
            time: 0,
            reqs: {
                url: '/pemissions/list',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
       return feedback(collection,"","")

    }
    function ErasePermissionFromUser(data: any) {
        // central/settings/permisions/list
        const collection: any = {
            reload: 1,
            StateStore: 'staff-attached-permission',
            time: 0,
            reqs: {
                url: '/central/settings/permisions/remove_ability',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
              return feedback(collection,"Permission removed"," Failed to remove Permission")


    }
    function AttachPermissionToUser(data: any) {
        const collection: any = {
            reload: 1,
            StateStore: 'staff-attached-permission',
            time: 0,
            reqs: {
                url: '/central/settings/permisions/add_ability',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
             return feedback(collection," Permission attached "," Failed to attach Permission")

    }
 

    return {
        create,Erase, ErasePermissionFromUser,AttachPermissionToUser
    };
}
