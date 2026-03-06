
export const tenantStep1 = [{
    label: 'Sacco Name',
    name: 'SACCOName',
    type: 'text',
    required: true,
    props: { placeholder: 'Enter  SACCO Name' },
//    change: (value:any, form:any) => {
//     console.log(form.value);
//     tenantStep1[1].props.placeholder = form.value   
    
//         // form.value = value.replace(/\s+/g, '').toLowerCase()+'.mfukopro.com'
//     }
},
{
    label: 'subdomain',
    name: 'Subdomain',
    type: 'text',
    disabled: true,
    required: true,
    suffix: '.mfukopro.com',
    props: { placeholder: 'Enter Subdomain name' },
}]
