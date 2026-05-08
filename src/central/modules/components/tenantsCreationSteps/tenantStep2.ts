


export const tenantStep2 = [{
    label: 'admin Name',
    name: 'admin_name',
    type: 'text',
    required: true,
    props: { placeholder: 'Enter Admin Name' },
},
{
    label: 'admin Email',
    name: 'admin_email',
    type: 'email',
    required: true,
    props: { placeholder: 'Enter Admin Email' },
},
{
    label: 'admin Phone',
    name: 'admin_phone',
    type: 'tel',
    required: false,
    props: { placeholder: 'Enter Admin Phone' },
},
{
    label: 'admin Password',
    name: 'admin_password',
    type: 'password',
    required: true,
    props: { placeholder: 'Enter password' },
},
{
    label: 'confirm Password',
    name: 'confirm_password',
    type: 'password',
    required: true,
    matchName: 'admin_password',
    props: { placeholder: 'Re-enter password' },
},

]
