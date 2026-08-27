// src/services/apiTopics.js
const mockTopics = [
  {
    id: 1,
    name: 'Safety Compliance',
    weight: 90,
    documents: [
      { id: 101, title: 'Q2 Safety Audit Report', date: '2023-07-10' },
      { id: 102, title: 'Incident Response Protocol', date: '2023-06-15' },
    ],
  },
  {
    id: 2,
    name: 'Equipment Maintenance',
    weight: 75,
    documents: [
      { id: 103, title: 'Excavator Maintenance Log', date: '2023-08-01' },
      { id: 104, title: 'Conveyor Belt Inspection', date: '2023-07-28' },
    ],
  },
  {
    id: 3,
    name: 'Resource Optimization',
    weight: 60,
    documents: [
      { id: 105, title: 'Water Usage Analysis', date: '2023-07-20' },
    ],
  },
  {
    id: 4,
    name: 'Geological Surveys',
    weight: 50,
    documents: [
      { id: 106, title: 'Sector B Core Sampling', date: '2023-06-05' },
    ],
  },
  {
    id: 5,
    name: 'Sustainability Initiatives',
    weight: 40,
    documents: [
      { id: 107, title: 'Carbon Footprint Reduction Plan', date: '2023-05-30' },
    ],
  }
];

export const getTopics = async () => {
  return new Promise((resolve) => setTimeout(() => resolve(mockTopics), 500));
};
