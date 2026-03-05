type Option = {
  id: string
  name: string
}

export const memberTypeOptions: Option[] = [
  { id: 'new_member', name: 'New Member' },
  { id: 'existing_member', name: 'Existing Member' },
]

export const salutationOptions: Option[] = [
  { id: 'mr', name: 'Mr' },
  { id: 'mrs', name: 'Mrs' },
  { id: 'ms', name: 'Ms' },
  { id: 'dr', name: 'Dr' },
]

export const genderOptions: Option[] = [
  { id: 'male', name: 'Male' },
  { id: 'female', name: 'Female' },
  { id: 'other', name: 'Other' },
]

export const maritalStatusOptions: Option[] = [
  { id: 'single', name: 'Single' },
  { id: 'married', name: 'Married' },
  { id: 'divorced', name: 'Divorced' },
  { id: 'widowed', name: 'Widowed' },
]

export const nationalityOptions: Option[] = [
  { id: 'Uganda', name: 'Uganda' },
  { id: 'Kenya', name: 'Kenya' },
  { id: 'Tanzania', name: 'Tanzania' },
  { id: 'Rwanda', name: 'Rwanda' },
]

export const shareholderOptions: Option[] = [
  { id: 'yes', name: 'Yes' },
  { id: 'no', name: 'No' },
]
