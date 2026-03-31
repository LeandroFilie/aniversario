import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
  ,
  animations: [
    trigger('letterState', [
      state('closed', style({
        transform: 'translateY(-8px) rotateX(6deg)',
        boxShadow: '0 8px 18px rgba(0,0,0,0.18)',
        opacity: 0.75
      })),
      state('open', style({
        transform: 'translateY(-140px) rotateX(-12deg) scale(1.02)',
        boxShadow: '0 18px 36px rgba(0,0,0,0.28)',
        opacity: 1
      })),
  // flap will start first, then letter animates with a small delay so they feel synchronized
  transition('closed => open', animate('520ms 40ms cubic-bezier(.2,.9,.2,1)')),
      transition('open => closed', animate('500ms ease'))
    ]),
    trigger('flapState', [
  state('closed', style({ transform: 'rotateX(0deg)', zIndex: 4 })),
  state('open', style({ transform: 'rotateX(180deg)', zIndex: 1 })),
  transition('closed => open', animate('520ms ease')),
  transition('open => closed', animate('450ms ease'))
    ])
  ]
})
export class AppComponent {
    isOpen = false;

  @ViewChild('confettiCanvas', { static: false }) confettiCanvas!: ElementRef<HTMLCanvasElement>;

  private confettiCtx?: CanvasRenderingContext2D;

  toggleEnvelope() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // small timeout so the canvas is available and the envelope animation starts
      setTimeout(() => this.launchConfetti(), 80);
    }
  }

  private launchConfetti() {
    const canvas = this.confettiCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.confettiCtx = ctx;

    // size canvas to window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces: Array<any> = [];
    const colors = ['#f6c', '#ff5', '#6cf', '#f66', '#6f6', '#fc6'];

    // larger burst: more pieces with wider size/speed variance
    for (let i = 0; i < 220; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -Math.random() * 400,
        r: 5 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 14 - 7,
        speed: 2 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2
      });
    }

    // physics-driven fall with fade-out near bottom for smooth finish
    for (const p of pieces) {
      p.opacity = 1;
      p.gravity = 0.03 + Math.random() * 0.06;
      p.decay = 0.002 + Math.random() * 0.008;
      p.vx = (Math.random() - 0.5) * 2;
      p.vy = 0.5 + Math.random() * 1.5;
    }

    const frame = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];

        // update physics
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += 0.02;

        // when near bottom, start fading and slow horizontal movement
        if (p.y > canvas.height - 60) {
          p.opacity -= p.decay;
          p.vx *= 0.98;
          p.vy *= 0.98;
        }

        // draw with opacity
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        ctx.restore();

        // remove when invisible or far off-screen
        if (p.opacity <= 0 || p.y > canvas.height + 100) {
          pieces.splice(i, 1);
        }
      }

      if (pieces.length > 0) {
        requestAnimationFrame(frame);
      } else {
        // clean up canvas gently
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    frame();
  }
}
