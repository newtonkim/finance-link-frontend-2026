// import { notify } from '../../Global/Toasters';
import { formDataFormat, scopeValues } from '@/Global';
import { notify } from '@/Global/Toasters/ToastMsg';
import { pomPinia } from 'septor-store';

export function permissionsApi() {
    const Store = pomPinia();

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
        const res: any = Store.stateGenaratorApi(collection);

        let msg: Record<string, string> = {
            msg: 'Failed to create pemissions',
            type: 'Error',
        };
        if (!res || res.status == 200) {
            msg = {
                msg: 'pemissions created successfully',
                type: 'Success',
            };
        }
        notify(msg);
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
        return Store.stateGenaratorApi(collection);
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
        return Store.stateGenaratorApi(collection);
    }
 

    return {
        create,Erase, ErasePermissionFromUser
    };
}
