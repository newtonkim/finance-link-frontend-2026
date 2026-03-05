// import { notify } from '../../Global/Toasters';
import { notify } from '@/pages/Global/Toasters';
import { pomPinia } from 'septor-store';

export function StaffApi() {
    const Store = pomPinia();

    function create(data: any) {
        const collection: any = {
            reload: 1,
            StateStore: 'createStaff',
            time: 0,
            reqs: {
                url: '/staff/create',
                method: 'post',
                data,
            },
        };
        const res: any = Store.stateGenaratorApi(collection);

        let msg: Record<string, string> = {
            msg: 'Failed to create staff',
            type: 'Error',
        };
        if (!res || res.status == 200) {
            msg = {
                msg: 'Staff created successfully',
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
                url: '/staff/positions',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
        return Store.stateGenaratorApi(collection);
    }
    function fetchStaff(data: any) {
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
        fetchStaff,
        fetchPositions,
    };
}
