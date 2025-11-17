export const agentsData = [
  { name: 'Wave Shipping' },
  { name: 'GAC' },
  { name: 'SGM' },
  { name: 'Wilhelmsen' },
  { name: 'ISS' },
];

export const berthsData = [
  { name: 'Dyke-1' },
  { name: 'K-3' },
  { name: 'K-2' },
  { name: 'K-1' },
  { name: '112' },
  { name: '102' },
  { name: 'BIP' },
  { name: 'BLB-1' },
  { name: 'BLB-2' },
  { name: 'M-7' },
];

export const clientsData = [
  { name: 'Mobil' },
  { name: 'Trafigura' },
  { name: 'Chevron SG' },
  { name: 'PCIA' },
  { name: 'Chevron Downstream' },
  { name: 'Glencore' },
  { name: 'United' },
  { name: 'S-Oil' },
  { name: 'Q8' },
  { name: 'Gunvor' },
  { name: 'ASCC' },
  { name: 'Ampol AU' },
  { name: 'Ampol SG' },
  { name: 'BP AU' },
  { name: 'Viva Energy' },
  { name: 'BP SG' },
]

export const productTypesData = [
  { name: '91 Ron' },
  { name: '95 Ron' },
  { name: '98 Ron' },
  { name: 'Jet-A1' },
  { name: 'Diesel' },
  { name: 'Anhydrous Ammonia' },
  { name: 'Base Oils' },
]

export const chemistsData = [
  { name: 'Farshid' },
  { name: 'Anh' },
  { name: 'Ampol Lab' },
];

export const samplersData = [
  {
    name: 'Cesar',
    email: 'cesar@amspec.com',
    phone: '+61 400 123 456',
    has24HourRestriction: true,
    restrictedDays: [0, 6], // No work on Sunday and Saturday
  },
  {
    name: 'Ruben',
    email: 'ruben@amspec.com',
    phone: '+61 400 234 567',
    has24HourRestriction: false,
    restrictedDays: [0], // No work on Sunday
  },
  {
    name: 'Laura',
    email: 'laura@amspec.com',
    phone: '+61 400 345 678',
    has24HourRestriction: true,
    restrictedDays: [],
  },
  {
    name: 'Sakik',
    email: 'sakik@amspec.com',
    has24HourRestriction: false,
    restrictedDays: [5, 6], // No work on Friday and Saturday
  },
  {
    name: 'Edwind',
    phone: '+61 400 456 789',
    has24HourRestriction: true,
    restrictedDays: [0],
  },
  {
    name: 'Ash',
    email: 'ash@amspec.com',
    phone: '+61 400 567 890',
    has24HourRestriction: false,
    restrictedDays: [],
  },
  {
    name: 'Jay-cen',
    email: 'jaycen@amspec.com',
    has24HourRestriction: true,
    restrictedDays: [1, 2], // No work on Monday and Tuesday
  },
];

export const surveyorsData = [
  { name: 'Ash' },
  { name: 'Jay-Cen' },
];

export const terminalsData = [
  { name: 'Orica Botany' },
  { name: 'BP ATOM' },
  { name: 'Vopak' },
  { name: 'Stolthaven' },
  { name: 'Ampol Kurnell' },
  { name: 'Quantem' },
  { name: 'Orica Newcastle' },
  { name: 'Park Fuels Newcastle' },
  { name: 'Park Fuels Kembla' },
];
