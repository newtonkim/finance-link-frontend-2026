import { fetchTableData } from "@/Global";
import { pomPinia } from 'septor-store';
export function memberAccountApi(){
    const Store = pomPinia();
      async function  getProductCharges(data: any) {
        const getCharges = await fetchTableData({
            data: data,
            Store,
            saveData: true,
            props: {
                url: 'global/get-product-charges',
                method: 'post',
                time: 0,
            },
        })
        return getCharges.payload
    }

    return {
        getProductCharges
    }
    
}

