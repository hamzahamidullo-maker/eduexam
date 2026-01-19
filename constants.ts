
import { Exam, Center } from './types';

export const MONTHS = Array.from({ length: 16 }, (_, i) => i + 1);

export const MOCK_CENTERS: Center[] = [
  { id: 'c1', name: 'Al-Xorazmiy Ta\'lim Markazi', email: 'admin@alxorazmiy.uz', location: 'Toshkent' },
  { id: 'c2', name: 'Ziyo Nuri Akademiyasi', email: 'hello@ziyo.uz', location: 'Samarqand' },
];

export const MOCK_EXAMS: Exam[] = [
  {
    id: 'ex1',
    title: 'Ingliz tili - Boshlang\'ich grammatika',
    month: 1,
    mode: 'ADULT',
    duration: 15,
    centerId: 'c1',
    published: true,
    createdAt: Date.now(),
    questions: [
      {
        id: 'q1',
        text: '"Go" fe' + "'" + 'lining o' + "'" + 'tgan zamon shakli qaysi?',
        type: 'CHOICE',
        options: [
          { key: 'A', text: 'Went' },
          { key: 'B', text: 'Gone' },
          { key: 'C', text: 'Goes' },
          { key: 'D', text: 'Going' }
        ],
        correctAnswer: 'A',
        points: 5
      },
      {
        id: 'q2',
        text: '"Child" so' + "'" + 'zining ko' + "'" + 'plik shaklini yozing',
        type: 'TEXT',
        correctAnswer: 'children',
        points: 10
      }
    ]
  },
  {
    id: 'ex2',
    title: 'Hayvonlar dunyosi!',
    month: 2,
    mode: 'KIDS',
    duration: 10,
    centerId: 'c1',
    published: true,
    createdAt: Date.now(),
    questions: [
      {
        id: 'kq1',
        text: 'Qaysi hayvon "Miyov" deydi?',
        type: 'CHOICE',
        options: [
          { key: 'A', text: 'Kuchuk' },
          { key: 'B', text: 'Mushuk' },
          { key: 'C', text: 'Sigir' }
        ],
        correctAnswer: 'B',
        points: 5
      }
    ]
  }
];
