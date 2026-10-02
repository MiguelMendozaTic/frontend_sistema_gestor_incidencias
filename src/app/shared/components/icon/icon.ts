import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface Shape {
  t: 'path' | 'circle' | 'rect';
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  rx?: number;
}

const p = (d: string): Shape => ({ t: 'path', d });
const c = (cx: number, cy: number, r: number): Shape => ({ t: 'circle', cx, cy, r });
const r = (x: number, y: number, w: number, h: number, rx = 0): Shape => ({ t: 'rect', x, y, w, h, rx });

/** Iconos de trazo (estilo Lucide, licencia ISC) en una rejilla de 24px. */
const ICONS = {
  plus: [p('M5 12h14'), p('M12 5v14')],
  search: [c(11, 11, 8), p('m21 21-4.3-4.3')],
  x: [p('M18 6 6 18'), p('m6 6 12 12')],
  refresh: [
    p('M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8'),
    p('M21 3v5h-5'),
    p('M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16'),
    p('M8 16H3v5'),
  ],
  eye: [
    p('M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0'),
    c(12, 12, 3),
  ],
  pencil: [
    p('M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z'),
    p('m15 5 4 4'),
  ],
  message: [p('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z')],
  'chevron-left': [p('m15 18-6-6 6-6')],
  'chevron-right': [p('m9 18 6-6-6-6')],
  'chevron-down': [p('m6 9 6 6 6-6')],
  'chevron-up': [p('m18 15-6-6-6 6')],
  'chevrons-up': [p('m17 11-5-5-5 5'), p('m17 18-5-5-5 5')],
  equal: [p('M5 9h14'), p('M5 15h14')],
  menu: [p('M4 6h16'), p('M4 12h16'), p('M4 18h16')],
  sun: [
    c(12, 12, 4),
    p('M12 2v2'),
    p('M12 20v2'),
    p('m4.93 4.93 1.41 1.41'),
    p('m17.66 17.66 1.41 1.41'),
    p('M2 12h2'),
    p('M20 12h2'),
    p('m6.34 17.66-1.41 1.41'),
    p('m19.07 4.93-1.41 1.41'),
  ],
  moon: [p('M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z')],
  logout: [p('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'), p('m16 17 5-5-5-5'), p('M21 12H9')],
  user: [p('M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'), c(12, 7, 4)],
  dashboard: [r(3, 3, 7, 9, 1), r(14, 3, 7, 5, 1), r(14, 12, 7, 9, 1), r(3, 16, 7, 5, 1)],
  users: [
    p('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'),
    c(9, 7, 4),
    p('M22 21v-2a4 4 0 0 0-3-3.87'),
    p('M16 3.13a4 4 0 0 1 0 7.75'),
  ],
  ticket: [
    p('M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z'),
    p('M13 5v2'),
    p('M13 17v2'),
    p('M13 11v2'),
  ],
  'panel-left': [r(3, 3, 18, 18, 2), p('M9 3v18')],
  'arrow-left': [p('m12 19-7-7 7-7'), p('M19 12H5')],
  check: [p('M20 6 9 17l-5-5')],
  shield: [
    p('M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'),
    p('m9 12 2 2 4-4'),
  ],
  wrench: [
    p('M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'),
  ],
  inbox: [
    p('M22 12h-6l-2 3h-4l-2-3H2'),
    p('M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'),
  ],
  alert: [c(12, 12, 10), p('M12 8v4'), p('M12 16h.01')],
  clock: [c(12, 12, 10), p('M12 6v6l4 2')],
  activity: [p('M22 12h-4l-3 9L9 3l-3 9H2')],
  send: [
    p('M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.63l-19 6.5a.5.5 0 0 0-.02.93l7.93 3.18a2 2 0 0 1 1.11 1.11z'),
    p('m21.85 2.15-10.94 10.94'),
  ],
  lock: [r(3, 11, 18, 11, 2), p('M7 11V7a5 5 0 0 1 10 0v4')],
  monitor: [r(2, 3, 20, 14, 2), p('M8 21h8'), p('M12 17v4')],
  trash: [p('M3 6h18'), p('M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6'), p('M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2')],
  settings: [
    p('M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'),
    c(12, 12, 3),
  ],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0', 'aria-hidden': 'true' },
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.stroke-width]="stroke()"
    >
      @for (s of shapes(); track $index) {
        @switch (s.t) {
          @case ('path') {
            <path [attr.d]="s.d" />
          }
          @case ('circle') {
            <circle [attr.cx]="s.cx" [attr.cy]="s.cy" [attr.r]="s.r" />
          }
          @case ('rect') {
            <rect [attr.x]="s.x" [attr.y]="s.y" [attr.width]="s.w" [attr.height]="s.h" [attr.rx]="s.rx" />
          }
        }
      }
    </svg>
  `,
})
export class Icon {
  name = input.required<IconName>();
  size = input(16);
  stroke = input(2);
  protected shapes = computed<Shape[]>(() => ICONS[this.name()]);
}
