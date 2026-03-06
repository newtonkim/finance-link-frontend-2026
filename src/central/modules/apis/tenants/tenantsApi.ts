// import { notify } from '../../Global/Toasters';
import { notify } from '@/Global/Toasters/ToastMsg';
import { pomPinia } from 'septor-store';

export function tenantsApi() {
    const Store = pomPinia();

    function create(data: any) {
        const collection: any = {
            reload: 1,
            StateStore: 'createTenants',
            time: 0,
            reqs: {
                url: '/Tenants/create',
                method: 'post',
                data,
            },
        };
        const res: any = Store.stateGenaratorApi(collection);

        let msg: Record<string, string> = {
            msg: 'Failed to create Tenants',
            type: 'Error',
        };
        if (!res || res.status == 200) {
            msg = {
                msg: 'Tenants created successfully',
                type: 'Success',
            };
        }
        notify(msg);
    }
    function fetchPositions(data?: any) {
        const collection: any = {
            reload: 0,
            StateStore: 'fetchPositions',
            time: 0,
            reqs: {
                url: '/Tenants/positions',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
        return Store.stateGenaratorApi(collection);
    }
    function fetchTenants(data: any) {
        const collection: any = {
            reload: 1,
            StateStore: 'fetchPositions',
            time: 0,
            reqs: {
                url: '/Tenants/list',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
        return Store.stateGenaratorApi(collection);
    }
    function Erase(data: any) {
        const collection: any = {
            reload: 1,
            StateStore: 'fetchPositions',
            time: 0,
            reqs: {
                url: '/Tenants/list',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
        return Store.stateGenaratorApi(collection);
    }

    return {
        create,Erase,
        fetchTenants,
        fetchPositions,
    };
}
