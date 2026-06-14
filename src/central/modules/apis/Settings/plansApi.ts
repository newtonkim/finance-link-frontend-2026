import { pomPinia } from 'septor-store';
import { apiClient } from '@/central/api/client';

export function plansApi() {
    const Store = pomPinia();
    function feedback(collection: any) {
        return Store.stateGenaratorApi(collection)
    }

    async function create(data: any) {
        const res = await apiClient.post('central/settings/plans/create', data)
        return res
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
              return feedback(collection)
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
             return feedback(collection)

    }
   

    return {
        create, EraseplansFromUser,AttachplansToUser
    };
}
