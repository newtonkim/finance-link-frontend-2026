// import { notify } from '../../Global/Toasters';
import { formDataFormat, scopeValues } from '@/Global';
import { notify } from '@/Global/Toasters/ToastMsg';
import { pomPinia } from 'septor-store';

export function staffsApi() {
    const Store = pomPinia();

    function create(data: any) {
      const formDataScoping:any=  formDataFormat(scopeValues(data));
        const collection: any = {
            reload: 1,
            StateStore: 'staff',
            time: 0,
            reqs: {
                url: 'central/staff/create',
                method: 'post',
                data:formDataScoping,
            },
        };
        const res: any = Store.stateGenaratorApi(collection);

        let msg: Record<string, string> = {
            msg: 'Failed to create staff',
            type: 'Error',
        };
        if (!res || res.status == 200) {
            msg = {
                msg: 'staff created successfully',
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
                url: '/staff/list',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
        return Store.stateGenaratorApi(collection);
    }
   

    return {
        create,Erase, 
    };
}
