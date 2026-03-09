
export const tenantStep1 = [{
    label: 'Sacco Name',
    name: 'name',
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
    name: 'subdomain',
    type: 'text',
    disabled: true,
    required: true,
    suffix: '.mfukopro.com',
    props: { placeholder: 'Enter Subdomain name' },
}]
