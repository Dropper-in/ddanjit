import { iconUrl } from '@/shared/icons';
import type { AmmoType } from './types';

/** sticks: true = 박힘, false = 튕겨나감 */
export const AMMO_TYPES: AmmoType[] = [
  {
    id: 'stone',
    icon: iconUrl('stone'),
    label: '돌멩이',
    color: '#807a6e',
    sticks: false,
    size: 56,
  },
  {
    id: 'trash',
    icon: iconUrl('trash'),
    label: '쓰레기',
    color: '#7a4a14',
    sticks: false,
    size: 56,
  },
  {
    id: 'money',
    icon: '',
    emoji: '💵',
    label: '돈다발',
    color: '#3a8a3a',
    sticks: false,
    happy: true,
    size: 56,
  },
  { id: 'heart', icon: '', emoji: '❤️', label: '하트', color: '#cc1a1a', sticks: true, size: 56 },
  { id: 'kiss', icon: '', emoji: '💋', label: '뽀뽀', color: '#cc1a4a', sticks: true, size: 56 },
  { id: 'star', icon: iconUrl('star'), label: '별', color: '#ffd24a', sticks: true, size: 56 },
  {
    id: 'anger',
    icon: '',
    emoji: '💢',
    label: '빠직마크',
    color: '#a01acc',
    sticks: true,
    happy: false,
    size: 56,
  },
];

// 30ms 간격 tick 기준: FLIGHT_FRAMES=12 → 약 360ms 비행, BOUNCE_FRAMES=44 → 약 1.3초 튕김
export const FLIGHT_FRAMES = 12;
export const BOUNCE_FRAMES = 44;

export function getReactions(happy: boolean): string[] {
  return happy ? ['♥', '><', '꺅', 'ㅋ', '헤헤'] : ['ㅠㅠ', '><', 'ㅜㅜ', '헉', '악'];
}
